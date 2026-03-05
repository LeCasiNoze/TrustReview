import { NextResponse } from "next/server";
import { createStripeSubscription, STRIPE_PLANS } from "@/lib/stripe";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getUserSubscriptionInfoServer } from "@/lib/subscription.server";
import Stripe from 'stripe';

export async function POST(req: Request) {
  try {
    const { planId, billingCycle } = await req.json();
    
    if (!planId || !billingCycle) {
      return NextResponse.json({ error: "Plan and billing cycle are required" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    // Récupérer les infos d'abonnement actuel
    const subscriptionInfo = await getUserSubscriptionInfoServer();
    
    if (!subscriptionInfo || !subscriptionInfo.subscription?.stripe_customer_id) {
      return NextResponse.json({ error: "No Stripe customer found" }, { status: 400 });
    }

    // Déterminer le prix Stripe selon le plan et le cycle de facturation
    let priceId: string;
    switch (planId) {
      case 'pro':
        priceId = billingCycle === 'yearly' ? STRIPE_PLANS.pro_yearly : STRIPE_PLANS.pro_monthly;
        break;
      case 'agency':
        priceId = billingCycle === 'yearly' ? STRIPE_PLANS.agency_yearly : STRIPE_PLANS.agency_monthly;
        break;
      default:
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Créer l'abonnement Stripe
    const stripeSubscriptionResponse = await createStripeSubscription(
      subscriptionInfo.subscription.stripe_customer_id,
      priceId
    );

    // Mettre à jour la base de données
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('slug', planId)
      .single();

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    await supabase
      .from('subscriptions')
      .update({
        plan_id: plan.id,
        stripe_subscription_id: stripeSubscriptionResponse.id,
        status: 'active',
        current_period_end: new Date((stripeSubscriptionResponse as any).current_period_end * 1000).toISOString(),
        cancel_at_period_end: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    return NextResponse.json({
      subscription: stripeSubscriptionResponse,
      clientSecret: stripeSubscriptionResponse.latest_invoice && 
        typeof stripeSubscriptionResponse.latest_invoice === 'object' && 
        'payment_intent' in stripeSubscriptionResponse.latest_invoice && 
        stripeSubscriptionResponse.latest_invoice.payment_intent
        ? (stripeSubscriptionResponse.latest_invoice.payment_intent as Stripe.PaymentIntent).client_secret
        : undefined
    });

  } catch (error) {
    console.error('Error creating Stripe subscription:', error);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}
