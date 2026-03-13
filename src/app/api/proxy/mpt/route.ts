import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const MPT_API_URL = process.env.TOOL_SERVER_URL || "http://43.155.158.149";
const MPT_PORT = "8080";

// Proxy to MoneyPrinterTurbo API with auth + usage checks
export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const supabase = createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    // Check enabled + usage
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_enabled, subscription_tier, usage_count, usage_limit")
      .eq("id", user.id)
      .single();

    if (!profile?.is_enabled) {
      return NextResponse.json({ error: "Account not activated. Please wait for admin approval." }, { status: 403 });
    }

    if (profile.usage_count >= profile.usage_limit) {
      return NextResponse.json({ error: "Usage limit reached. Please upgrade your plan." }, { status: 429 });
    }

    // Forward request to MPT API
    const body = await req.json();
    const { endpoint, ...params } = body;

    const mptUrl = `${MPT_API_URL}:${MPT_PORT}/api/v1${endpoint}`;
    const response = await fetch(mptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    // Increment usage on successful task creation
    if (response.ok) {
      await supabase.from("profiles").update({
        usage_count: profile.usage_count + 1,
        last_active_at: new Date().toISOString(),
      }).eq("id", user.id);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    console.error("MPT proxy error:", err);
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
  }
}

// GET proxy for task status queries
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const supabase = createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("task_id");

    if (!taskId) return NextResponse.json({ error: "task_id required" }, { status: 400 });

    const mptUrl = `${MPT_API_URL}:${MPT_PORT}/api/v1/tasks/${taskId}`;
    const response = await fetch(mptUrl);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
  }
}
