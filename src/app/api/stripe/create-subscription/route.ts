import { NextResponse } from "next/server";
import { createStripeSubscription, STRIPE_PLANS } from "@/lib/stripe";
import { getRequestIdentity, getSupabaseForIdentity } from "@/lib/request-identity";
import { getUserSubscriptionInfoServer } from "@/lib/subscription.server";
import Stripe from 'stripe';

export async function POST(req: Request) {
  try {
    const { planId, billingCycle } = await req.json();
    
    if (!planId || !billingCycle) {
      return NextResponse.json({ error: "Plan and billing cycle are required" }, { status: 400 });
    }

    // Vérifier l'authentification (Supabase ou temporaire)
    const identity = await getRequestIdentity();
    
    if (!identity.isAuthenticated || !identity.userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    // Pour les sessions temporaires, cette API n'est pas utilisée
    // On utilise create-checkout-session à la place
    if (identity.isTempSession) {
      return NextResponse.json({ error: "Use checkout session for temp users" }, { status: 400 });
    }

    const supabase = await getSupabaseForIdentity(identity);

    // Récupérer les infos d'abonnement actuel
    const subscriptionInfo = await getUserSubscriptionInfoServer(identity);
    
    if (!subscriptionInfo || !subscriptionInfo.subscription?.stripe_customer_id) {
      return NextResponse.json({ error: "No Stripe customer found" }, { status: 400 });
    }

    // Validation des plans (harmonisés: starter, pro, agency)
    const validPlans = ['starter', 'pro', 'agency'];
    const validCycles = ['monthly', 'yearly'];
    
    if (!validPlans.includes(planId)) {
      return NextResponse.json({ 
        error: "Plan invalide",
        details: `Plan "${planId}" non valide. Plans disponibles: ${validPlans.join(', ')}`
      }, { status: 400 });
    }
    
    if (!validCycles.includes(billingCycle)) {
      return NextResponse.json({ 
        error: "Cycle invalide", 
        details: `Cycle "${billingCycle}" non valide. Cycles disponibles: ${validCycles.join(', ')}`
      }, { status: 400 });
    }

    // Déterminer le prix Stripe selon le plan et le cycle de facturation
    const priceIdKey = `${planId}_${billingCycle}` as keyof typeof STRIPE_PLANS;
    const priceId = STRIPE_PLANS[priceIdKey];
    
    if (!priceId) {
      return NextResponse.json({ 
        error: "Plan non configuré",
        details: `Price ID pour ${planId} ${billingCycle} non trouvé dans STRIPE_PLANS`
      }, { status: 500 });
    }
    
    if (!priceId.startsWith('price_')) {
      return NextResponse.json({ 
        error: "Price ID invalide",
        details: `Price ID pour ${planId} ${billingCycle} invalide. Attendu: price_..., reçu: ${priceId}`
      }, { status: 500 });
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
      .eq('user_id', identity.userId);

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
