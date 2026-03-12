import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { tier } = await req.json();

  if (!tier || !["basic", "pro"].includes(tier)) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  // Verify user is logged in
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const cookieHeader = req.headers.get("cookie") || "";
  const sbAccessToken = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/)?.[1];

  let user = null;
  if (sbAccessToken) {
    try {
      const decoded = JSON.parse(decodeURIComponent(sbAccessToken));
      const accessToken = decoded?.[0] || decoded;
      if (typeof accessToken === "string") {
        const { data } = await anonClient.auth.getUser(accessToken);
        user = data.user;
      }
    } catch {}
  }

  // Also try Authorization header
  if (!user) {
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      const { data } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
      user = data.user;
    }
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prices: Record<string, { amount: number; name: string }> = {
    basic: { amount: 390, name: "AZZG Basic - 500 uses/mo" },
    pro: { amount: 1290, name: "AZZG Pro - 3000 uses/mo" },
  };

  const plan = prices[tier];

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            recurring: { interval: "month" },
            product_data: { name: plan.name },
            unit_amount: plan.amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        tier,
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://azzg.com"}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://azzg.com"}/pricing?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
