import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export const PLANS = {
  free: { name: "Free Trial", price: 0, usageLimit: 3, priceId: null },
  basic: { name: "Basic", price: 390, usageLimit: 500, priceId: "price_basic_monthly" },
  pro: { name: "Pro", price: 1290, usageLimit: 3000, priceId: "price_pro_monthly" },
} as const;
