import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe() {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return stripeInstance;
}

export const PLANS = {
  free: { name: "無料プラン", price: 0, monthlyDiagnosis: 3, stripePriceId: null },
  pro: {
    name: "Proプラン",
    price: 980,
    monthlyDiagnosis: -1,
    stripePriceId: process.env.STRIPE_PRICE_PRO || null,
  },
} as const;

export type PlanName = keyof typeof PLANS;

export function getPlanByPriceId(priceId: string): PlanName {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.stripePriceId === priceId) return key as PlanName;
  }
  return "free";
}
