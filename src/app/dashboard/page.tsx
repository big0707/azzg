"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";
import type { UserProfile } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const supabase = createBrowserClient();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      setUserEmail(user.email || "");
      
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (error || !data) {
        // Profile table might not exist yet or no profile row — show basic dashboard
        setProfile(null);
        setLoading(false);
        return;
      }
      setProfile(data as UserProfile);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading...</p>
      </div>
    </main>
  );

  // Fallback dashboard when profile table doesn't exist yet
  if (!profile) {
    return (
      <main className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="flex gap-3">
              <Link href="/tools" className="px-4 py-2 bg-indigo-600 rounded-lg text-sm hover:bg-indigo-500 transition">
                Browse Tools
              </Link>
              <button
                onClick={async () => { await supabase.auth.signOut(); router.push("/"); }}
                className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
              >
                Sign Out
              </button>
            </div>
          </div>

          <div className="border border-white/10 rounded-xl p-8 bg-white/5 text-center">
            <h2 className="text-xl font-bold mb-2">Welcome! 👋</h2>
            <p className="text-gray-400 mb-4">Logged in as <span className="text-white">{userEmail}</span></p>
            <p className="text-gray-500 text-sm">Your account is being set up. Browse our tools while you wait!</p>
            <Link href="/tools" className="inline-block mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold transition">
              Explore AI Tools →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const usagePercent = profile.usage_limit > 0 ? Math.round((profile.usage_count / profile.usage_limit) * 100) : 0;

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex gap-3">
            <Link href="/tools" className="px-4 py-2 bg-indigo-600 rounded-lg text-sm hover:bg-indigo-500 transition">
              Browse Tools
            </Link>
            <button
              onClick={async () => { await supabase.auth.signOut(); router.push("/"); }}
              className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Account Status */}
        {!profile.is_enabled && (
          <div className="mb-6 p-4 border border-yellow-500/30 bg-yellow-500/10 rounded-xl">
            <p className="text-yellow-300">
              ⏳ Your account is pending activation.
              {profile.payment_status === "paid"
                ? " Payment received — waiting for admin approval."
                : " Please subscribe to a plan to get started."}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="border border-white/10 rounded-xl p-6 bg-white/5">
            <p className="text-gray-400 text-sm">Plan</p>
            <p className="text-2xl font-bold capitalize">{profile.subscription_tier}</p>
          </div>
          <div className="border border-white/10 rounded-xl p-6 bg-white/5">
            <p className="text-gray-400 text-sm">Usage</p>
            <p className="text-2xl font-bold">{profile.usage_count} / {profile.usage_limit}</p>
            <div className="mt-2 w-full bg-white/10 rounded-full h-2">
              <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(usagePercent, 100)}%` }} />
            </div>
          </div>
          <div className="border border-white/10 rounded-xl p-6 bg-white/5">
            <p className="text-gray-400 text-sm">Status</p>
            <p className="text-2xl font-bold">
              {profile.is_enabled ? <span className="text-green-400">Active ✓</span> : <span className="text-yellow-400">Pending</span>}
            </p>
          </div>
        </div>

        {/* Upgrade CTA */}
        {profile.subscription_tier === "free" && (
          <div className="mb-8 border border-indigo-500/30 rounded-xl p-6 bg-indigo-500/10 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold mb-1">Upgrade your plan</h2>
              <p className="text-gray-400 text-sm">Get more uses and access to all tools.</p>
            </div>
            <Link href="/pricing" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold transition shrink-0">
              View Plans →
            </Link>
          </div>
        )}

        {/* Quick Info */}
        <div className="border border-white/10 rounded-xl p-6 bg-white/5">
          <h2 className="text-lg font-bold mb-4">Account Info</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Email</span><span>{profile.email}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Username</span><span>{profile.username || "-"}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Member since</span><span>{new Date(profile.created_at).toLocaleDateString()}</span></div>
          </div>
        </div>
      </div>
    </main>
  );
}
