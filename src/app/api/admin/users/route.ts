import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAILS = ["big0707@gmail.com"];

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function verifyAdmin(request: NextRequest) {
  // Get the user's token from the cookie or authorization header
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "") || "";
  
  // Use anon client to verify the user
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // Try to get user from cookie-based session
  const cookieHeader = request.headers.get("cookie") || "";
  const sbAccessToken = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/)?.[1];
  
  if (sbAccessToken) {
    try {
      const decoded = JSON.parse(decodeURIComponent(sbAccessToken));
      const accessToken = decoded?.[0] || decoded;
      if (typeof accessToken === "string") {
        const { data: { user } } = await anonClient.auth.getUser(accessToken);
        if (user && ADMIN_EMAILS.includes(user.email || "")) return user;
      }
    } catch {}
  }
  
  // Fallback: try authorization header
  if (token) {
    const { data: { user } } = await anonClient.auth.getUser(token);
    if (user && ADMIN_EMAILS.includes(user.email || "")) return user;
  }
  
  return null;
}

// GET - List all users
export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const supabase = createServiceClient();
  const { data: users, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users });
}

// PATCH - Update user (enable/disable, change tier, etc.)
export async function PATCH(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, ...updates } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  // Add metadata for enable/disable
  if ("is_enabled" in updates) {
    if (updates.is_enabled) {
      updates.enabled_at = new Date().toISOString();
      updates.enabled_by = admin.id;
    } else {
      updates.enabled_at = null;
      updates.enabled_by = null;
    }
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}
