"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";
import type { UserProfile } from "@/lib/supabase";

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "enabled">("all");
  const supabase = createBrowserClient();

  useEffect(() => { loadUsers(); }, [filter]);

  async function loadUsers() {
    setLoading(true);
    let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (filter === "pending") query = query.eq("payment_status", "paid").eq("is_enabled", false);
    if (filter === "enabled") query = query.eq("is_enabled", true);
    const { data } = await query;
    setUsers((data as UserProfile[]) || []);
    setLoading(false);
  }

  async function toggleUser(userId: string, currentStatus: boolean) {
    const { error } = await supabase
      .from("profiles")
      .update({
        is_enabled: !currentStatus,
        enabled_at: !currentStatus ? new Date().toISOString() : null,
        enabled_by: "admin",
      })
      .eq("id", userId);
    if (!error) loadUsers();
  }

  const pendingCount = users.filter((u) => u.payment_status === "paid" && !u.is_enabled).length;

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          {pendingCount > 0 && (
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm">
              {pendingCount} pending approval
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          {(["all", "pending", "enabled"] as const).map((f) => (
            <button
              key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                filter === f ? "bg-indigo-600" : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {f === "all" ? "All Users" : f === "pending" ? "⏳ Pending Approval" : "✅ Enabled"}
            </button>
          ))}
        </div>

        {/* User Table */}
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : (
          <div className="border border-white/10 rounded-xl overflow-hidden">
            <div className="grid grid-cols-7 gap-4 p-4 bg-white/5 text-sm text-gray-400 font-semibold">
              <span>Email</span>
              <span>Username</span>
              <span>Plan</span>
              <span>Payment</span>
              <span>Usage</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {users.map((user) => (
              <div key={user.id} className="grid grid-cols-7 gap-4 p-4 border-t border-white/5 text-sm items-center">
                <span className="truncate">{user.email}</span>
                <span>{user.username || "-"}</span>
                <span className="capitalize">{user.subscription_tier}</span>
                <span>
                  {user.payment_status === "paid" ? (
                    <span className="text-green-400">✅ Paid</span>
                  ) : (
                    <span className="text-gray-500">Pending</span>
                  )}
                </span>
                <span>{user.usage_count}/{user.usage_limit}</span>
                <span>
                  {user.is_enabled ? (
                    <span className="text-green-400">🟢 Enabled</span>
                  ) : (
                    <span className="text-red-400">🔴 Disabled</span>
                  )}
                </span>
                <button
                  onClick={() => toggleUser(user.id, user.is_enabled)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition ${
                    user.is_enabled
                      ? "bg-red-500/20 text-red-300 hover:bg-red-500/40"
                      : "bg-green-500/20 text-green-300 hover:bg-green-500/40"
                  }`}
                >
                  {user.is_enabled ? "Disable" : "Enable"}
                </button>
              </div>
            ))}
            {users.length === 0 && (
              <p className="p-6 text-gray-500 text-center">No users found</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
