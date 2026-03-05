import { NextResponse } from "next/server";
import { stripe, STRIPE_PLANS } from "@/lib/stripe";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getUserSubscriptionInfo } from "@/lib/subscription";

export async function POST(req: Request) {
  try {
    const { planId, billingCycle = 'monthly' } = await req.json();

    if (!planId) {
      return NextResponse.json({ error: "Plan ID requis" }, { status: 400 });
    }

    // Récupérer les infos de l'utilisateur
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non authentifié" }, { status: 401 });
    }

    // Récupérer les infos d'abonnement
    const subscriptionInfo = await getUserSubscriptionInfo();
    
    // Déterminer le price ID Stripe
    let priceId: string;
    switch (planId) {
      case 'pro':
        priceId = billingCycle === 'yearly' ? STRIPE_PLANS.pro_yearly : STRIPE_PLANS.pro_monthly;
        break;
      case 'agency':
        priceId = billingCycle === 'yearly' ? STRIPE_PLANS.agency_yearly : STRIPE_PLANS.agency_monthly;
        break;
      default:
        return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
    }

    // Créer ou récupérer le client Stripe
    let customerId = subscriptionInfo.subscription?.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: user.user_metadata?.name || user.email!,
        metadata: {
          user_id: user.id,
          source: 'trustreview'
        }
      });
      customerId = customer.id;

      // Sauvegarder le customer ID en base
      await supabase
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);
    }

    // Créer la session Checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/billing?canceled=true`,
      metadata: {
        user_id: user.id,
        plan_id: planId,
        billing_cycle: billingCycle,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_id: planId,
          billing_cycle: billingCycle,
        },
      },
    });

    return NextResponse.json({ sessionId: session.id });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la session de paiement" },
      { status: 500 }
    );
  }
}
