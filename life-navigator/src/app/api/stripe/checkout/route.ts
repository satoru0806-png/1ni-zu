import { getAuthUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, PLANS } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;

    const priceId = PLANS.pro.stripePriceId;
    if (!priceId) {
      return NextResponse.json({ error: "Stripe price not configured" }, { status: 500 });
    }

    const stripe = getStripe();
    const admin = createAdminClient();

    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileErr) {
      return NextResponse.json(
        { error: `Profile query failed: ${profileErr.message}` },
        { status: 500 }
      );
    }

    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      const { error: upsertErr } = await admin.from("profiles").upsert({
        id: user.id,
        stripe_customer_id: customerId,
      });
      if (upsertErr) {
        return NextResponse.json(
          { error: `Profile upsert failed: ${upsertErr.message}` },
          { status: 500 }
        );
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://life-navigator-peach.vercel.app";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/today?payment=success`,
      cancel_url: `${baseUrl}/today?payment=cancel`,
      metadata: { supabase_user_id: user.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[stripe/checkout]", err);
    return NextResponse.json(
      { error: `Checkout failed: ${message}` },
      { status: 500 }
    );
  }
}
