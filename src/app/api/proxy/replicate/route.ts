import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || "";
const MINIMAX_BASE = "https://api.minimax.io/v1";

// POST: Create a new video generation task
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
    const { prompt, model } = body;

    const response = await fetch(`${MINIMAX_BASE}/video_generation`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MINIMAX_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || "video-01",
        prompt: prompt,
      }),
    });

    const data = await response.json();

    if (data.base_resp?.status_code === 0) {
      // Success - increment usage
      await supabase.from("profiles").update({
        usage_count: profile.usage_count + 1,
        last_active_at: new Date().toISOString(),
      }).eq("id", user.id);

      return NextResponse.json({
        id: data.task_id,
        status: "processing",
      });
    } else {
      return NextResponse.json({
        error: data.base_resp?.status_msg || "Failed to create task",
      }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

// GET: Poll task status / retrieve video
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const supabase = createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("id");
    if (!taskId) return NextResponse.json({ error: "id required" }, { status: 400 });

    const response = await fetch(`${MINIMAX_BASE}/query/video_generation?task_id=${taskId}`, {
      headers: { "Authorization": `Bearer ${MINIMAX_API_KEY}` },
    });

    const data = await response.json();

    if (data.base_resp?.status_code !== 0) {
      return NextResponse.json({
        error: data.base_resp?.status_msg || "Query failed",
      }, { status: 400 });
    }

    // Map MiniMax status to our standard format
    const status = data.status;
    const result: any = { id: taskId, status };

    if (status === "Success") {
      result.status = "succeeded";
      result.output = data.file_id;
      // Get the download URL
      if (data.file_id) {
        const fileRes = await fetch(`${MINIMAX_BASE}/files/retrieve?file_id=${data.file_id}`, {
          headers: { "Authorization": `Bearer ${MINIMAX_API_KEY}` },
        });
        const fileData = await fileRes.json();
        if (fileData.file?.download_url) {
          result.video_url = fileData.file.download_url;
        }
      }
    } else if (status === "Failed") {
      result.status = "failed";
      result.error = "Video generation failed";
    } else {
      // Queueing, Processing, etc.
      result.status = "processing";
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
