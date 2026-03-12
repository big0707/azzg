import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { tier, accessToken } = await req.json();

  if (!tier || !["basic", "pro"].includes(tier)) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  // Verify user
  const token = accessToken || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user }, error } = await anonClient.auth.getUser(token);
  if (error || !user) {
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
      success_url: `https://azzg.com/dashboard?payment=success`,
      cancel_url: `https://azzg.com/pricing?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
