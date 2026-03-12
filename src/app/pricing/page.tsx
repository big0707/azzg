"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const plans = [
  {
    tier: "free",
    name: "Free Trial",
    price: "$0",
    period: "",
    features: ["3 uses per day", "Basic tools only", "Community support"],
    cta: "Current Plan",
    highlight: false,
  },
  {
    tier: "basic",
    name: "Basic",
    price: "$3.9",
    period: "/mo",
    features: ["500 uses per month", "All tools", "Email support", "Priority queue"],
    cta: "Upgrade to Basic",
    highlight: true,
  },
  {
    tier: "pro",
    name: "Pro",
    price: "$12.9",
    period: "/mo",
    features: ["3000 uses per month", "All tools", "Priority support", "API access", "Custom workflows"],
    cta: "Upgrade to Pro",
    highlight: false,
  },
];

export default function PricingPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const supabase = createBrowserClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    checkAuth();

    const payment = searchParams.get("payment");
    if (payment === "cancelled") {
      setMessage("Payment was cancelled. You can try again anytime.");
    }
  }, []);

  async function handleCheckout(tier: string) {
    if (!user) {
      router.push("/auth/register");
      return;
    }
    if (tier === "free") return;

    setLoading(tier);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessage(data.error || "Failed to create checkout session");
        setLoading(null);
      }
    } catch (err) {
      setMessage("Something went wrong. Please try again.");
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            AZZG
          </Link>
          <div className="flex gap-3">
            {user ? (
              <Link href="/dashboard" className="px-4 py-2 text-sm text-gray-300 hover:text-white transition">← Dashboard</Link>
            ) : (
              <Link href="/auth/login" className="px-4 py-2 bg-indigo-600 rounded-lg text-sm hover:bg-indigo-500 transition">Sign In</Link>
            )}
          </div>
        </div>

        <div className="text-center mb-12 mt-8">
          <h1 className="text-4xl font-bold mb-4">Simple, transparent pricing</h1>
          <p className="text-gray-400 text-lg">Start free. Upgrade when you need more.</p>
        </div>

        {message && (
          <div className="mb-8 p-4 border border-yellow-500/30 bg-yellow-500/10 rounded-xl text-center text-yellow-300 text-sm">
            {message}
          </div>
        )}

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.tier}
              className={`rounded-xl p-8 relative ${
                plan.highlight
                  ? "border-2 border-indigo-500 bg-indigo-500/10"
                  : "border border-white/10 bg-white/5"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-xs px-3 py-1 rounded-full font-medium">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-gray-400">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-gray-300 flex items-center gap-2">
                    <span className="text-green-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleCheckout(plan.tier)}
                disabled={loading === plan.tier || plan.tier === "free"}
                className={`w-full py-3 rounded-lg font-semibold transition disabled:opacity-50 ${
                  plan.highlight
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                    : plan.tier === "free"
                    ? "bg-white/10 text-gray-400 cursor-default"
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                {loading === plan.tier ? "Redirecting..." : plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">FAQ</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-400 text-sm">Yes, you can cancel your subscription at any time. Your access will continue until the end of the billing period.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What happens after I pay?</h3>
              <p className="text-gray-400 text-sm">After payment, an admin will activate your account within 24 hours. You&apos;ll get full access to all tools based on your plan.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What counts as a &quot;use&quot;?</h3>
              <p className="text-gray-400 text-sm">Each time you run an AI tool (generate a video, translate content, etc.) counts as one use. Previewing tools is free.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
