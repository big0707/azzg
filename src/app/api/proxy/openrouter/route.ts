import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    // Get auth token
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const supabase = createServerClient();

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    // Check user is enabled
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

    // Forward to OpenRouter
    const body = await req.json();
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://azzg.com",
        "X-Title": "AZZG Platform",
      },
      body: JSON.stringify(body),
    });

    // Increment usage
    await supabase.from("profiles").update({ 
      usage_count: profile.usage_count + 1,
      last_active_at: new Date().toISOString(),
    }).eq("id", user.id);

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
