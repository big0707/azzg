import { createClient } from "@supabase/supabase-js";

export type UserProfile = {
  id: string;
  email: string;
  username: string | null;
  subscription_tier: "free" | "basic" | "pro";
  payment_status: "pending" | "paid" | "expired";
  is_enabled: boolean;
  usage_count: number;
  usage_limit: number;
  enabled_at: string | null;
  enabled_by: string | null;
  created_at: string;
  last_active_at: string | null;
  stripe_customer_id: string | null;
};

// Placeholder URL for build time when env vars are not available
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

// Client-side (browser) - singleton to persist session across components
let browserClient: ReturnType<typeof createClient> | null = null;

export function createBrowserClient() {
  if (browserClient) return browserClient;
  browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return browserClient;
}

// Server-side (API routes)
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
