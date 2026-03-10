"use client";
import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createBrowserClient();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Check your email</h1>
          <p className="text-gray-400">We sent a confirmation link to {email}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-white/10 rounded-xl p-8 bg-white/5">
        <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>
        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg focus:border-indigo-500 outline-none"
            required
          />
          <input
            type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg focus:border-indigo-500 outline-none"
            required
          />
          <input
            type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg focus:border-indigo-500 outline-none"
            required minLength={6}
          />
          <button
            type="submit" disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold transition disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <p className="text-gray-400 text-sm mt-4 text-center">
          Have an account? <Link href="/auth/login" className="text-indigo-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
