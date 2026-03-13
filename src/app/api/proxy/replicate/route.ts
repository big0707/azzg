import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || "";

// POST: Create a new prediction
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const supabase = createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_enabled, usage_count, usage_limit")
      .eq("id", user.id)
      .single();

    if (!profile?.is_enabled) {
      return NextResponse.json({ error: "Account not activated." }, { status: 403 });
    }
    if (profile.usage_count >= profile.usage_limit) {
      return NextResponse.json({ error: "Usage limit reached." }, { status: 429 });
    }

    const body = await req.json();
    const { model, input } = body;

    const response = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input }),
    });

    const data = await response.json();

    if (response.ok) {
      await supabase.from("profiles").update({
        usage_count: profile.usage_count + 1,
        last_active_at: new Date().toISOString(),
      }).eq("id", user.id);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET: Poll prediction status
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const supabase = createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const predictionId = searchParams.get("id");
    if (!predictionId) return NextResponse.json({ error: "id required" }, { status: 400 });

    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { "Authorization": `Bearer ${REPLICATE_API_TOKEN}` },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
