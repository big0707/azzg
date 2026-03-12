"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";
import type { UserProfile } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ADMIN_EMAILS = ["big0707@gmail.com"];

export default function AdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const supabase = createBrowserClient();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/auth/login"); return; }
      if (!ADMIN_EMAILS.includes(session.user.email || "")) {
        router.push("/dashboard");
        return;
      }
      setIsAdmin(true);
      setToken(session.access_token);
      await fetchUsers(session.access_token);
    }
    load();
  }, []);

  async function fetchUsers(accessToken?: string) {
    setLoading(true);
    const t = accessToken || token;
    const res = await fetch("/api/admin/users", {
      headers: { "Authorization": `Bearer ${t}` },
    });
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || []);
    }
    setLoading(false);
  }

  async function toggleEnable(userId: string, enable: boolean) {
    setActionLoading(userId);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ userId, is_enabled: enable }),
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_enabled: enable } : u));
    }
    setActionLoading(null);
  }

  async function changeTier(userId: string, tier: string) {
    setActionLoading(userId);
    const limits: Record<string, number> = { free: 3, basic: 500, pro: 3000 };
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ userId, subscription_tier: tier, usage_limit: limits[tier] || 3 }),
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, subscription_tier: tier as any, usage_limit: limits[tier] || 3 } : u));
    }
    setActionLoading(null);
  }

  if (!isAdmin) return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </main>
  );

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-gray-400 text-sm">{users.length} registered users</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => fetchUsers()} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition">
              ↻ Refresh
            </button>
            <Link href="/dashboard" className="px-4 py-2 text-sm text-gray-400 hover:text-white transition">← Dashboard</Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="border border-white/10 rounded-xl p-4 bg-white/5">
            <p className="text-gray-400 text-xs">Total Users</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </div>
          <div className="border border-white/10 rounded-xl p-4 bg-white/5">
            <p className="text-gray-400 text-xs">Active</p>
            <p className="text-2xl font-bold text-green-400">{users.filter(u => u.is_enabled).length}</p>
          </div>
          <div className="border border-white/10 rounded-xl p-4 bg-white/5">
            <p className="text-gray-400 text-xs">Pending</p>
            <p className="text-2xl font-bold text-yellow-400">{users.filter(u => !u.is_enabled).length}</p>
          </div>
          <div className="border border-white/10 rounded-xl p-4 bg-white/5">
            <p className="text-gray-400 text-xs">Paid</p>
            <p className="text-2xl font-bold text-indigo-400">{users.filter(u => u.subscription_tier !== "free").length}</p>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 border border-white/10 rounded-xl bg-white/5">
            <p className="text-gray-400">No users found.</p>
          </div>
        ) : (
          <div className="border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="text-left p-4 text-gray-400 font-medium">User</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Plan</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Usage</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Payment</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                    <th className="text-right p-4 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="p-4">
                        <p className="font-medium">{user.username || "-"}</p>
                        <p className="text-gray-500 text-xs">{user.email}</p>
                      </td>
                      <td className="p-4">
                        <select
                          value={user.subscription_tier}
                          onChange={(e) => changeTier(user.id, e.target.value)}
                          disabled={actionLoading === user.id}
                          className="bg-white/10 border border-white/10 rounded px-2 py-1 text-xs"
                        >
                          <option value="free">Free</option>
                          <option value="basic">Basic</option>
                          <option value="pro">Pro</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-300">{user.usage_count}/{user.usage_limit}</span>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded ${
                          user.payment_status === "paid" ? "bg-green-500/20 text-green-300" :
                          user.payment_status === "expired" ? "bg-red-500/20 text-red-300" :
                          "bg-gray-500/20 text-gray-300"
                        }`}>
                          {user.payment_status}
                        </span>
                      </td>
                      <td className="p-4">
                        {user.is_enabled ? (
                          <span className="text-green-400 text-xs">● Active</span>
                        ) : (
                          <span className="text-yellow-400 text-xs">● Pending</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => toggleEnable(user.id, !user.is_enabled)}
                          disabled={actionLoading === user.id}
                          className={`px-3 py-1 rounded text-xs transition disabled:opacity-50 ${
                            user.is_enabled
                              ? "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                              : "bg-green-500/20 text-green-300 hover:bg-green-500/30"
                          }`}
                        >
                          {actionLoading === user.id ? "..." : user.is_enabled ? "Disable" : "Enable"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
