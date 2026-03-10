import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  const supabase = createServerClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const tier = session.metadata?.tier as "basic" | "pro";

    if (userId && tier) {
      const usageLimit = tier === "pro" ? 3000 : 500;
      await supabase.from("profiles").update({
        payment_status: "paid",
        subscription_tier: tier,
        usage_limit: usageLimit,
        usage_count: 0,
        stripe_customer_id: session.customer as string,
      }).eq("id", userId);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;
    await supabase.from("profiles").update({
      payment_status: "expired",
      is_enabled: false,
      subscription_tier: "free",
      usage_limit: 3,
    }).eq("stripe_customer_id", customerId);
  }

  return NextResponse.json({ received: true });
}
