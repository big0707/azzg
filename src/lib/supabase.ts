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

// Client-side (browser)
export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Server-side (API routes)
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
