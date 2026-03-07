import { NextResponse } from "next/server";
import { stripe, STRIPE_PLANS } from "@/lib/stripe";
import { createSupabaseServer } from "@/lib/supabase-server";
import { authenticateRequest } from "@/lib/auth-middleware";

export async function POST(req: Request) {
  try {
    const { planId, billingCycle = 'monthly' } = await req.json();

    if (!planId) {
      return NextResponse.json({ error: "Plan ID requis" }, { status: 400 });
    }

    // Vérifier l'authentification (Supabase ou temporaire)
    const auth = await authenticateRequest();
    
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Utilisateur non authentifié" }, { status: 401 });
    }

    // Pour les sessions temporaires, créer un client Stripe avec l'email
    let user = null;
    let customerId: string | null = null;
    
    if (auth.isTempSession) {
      // Session temporaire : créer un client directement
      const customer = await stripe.customers.create({
        email: auth.email,
        name: auth.email,
        metadata: {
          source: 'trustreview_temp_session',
          temp_session: 'true'
        }
      });
      customerId = customer.id;
    } else {
      // Session Supabase normale
      const supabase = await createSupabaseServer();
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      
      if (!supabaseUser) {
        return NextResponse.json({ error: "Utilisateur non authentifié" }, { status: 401 });
      }
      
      user = supabaseUser;
      
      // Récupérer les infos d'abonnement existant
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .single();
      
      customerId = subscription?.stripe_customer_id || null;
    }
    
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

    // Créer le client Stripe si nécessaire
    if (!customerId && user) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: user.user_metadata?.name || user.email!,
        metadata: {
          user_id: user.id,
          source: 'trustreview'
        }
      });
      customerId = customer.id;

      // Sauvegarder le customer ID en base pour les sessions Supabase
      if (!auth.isTempSession) {
        const supabase = await createSupabaseServer();
        await supabase
          .from('subscriptions')
          .update({ stripe_customer_id: customerId })
          .eq('user_id', user.id);
      }
    }

    // Créer la session Checkout
    console.log("🔧 Creating Stripe session:", {
      customerId,
      priceId,
      planId,
      billingCycle,
      isTempSession: auth.isTempSession
    });

    const session = await stripe.checkout.sessions.create({
      customer: customerId!,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://trustreview-eight.vercel.app'}/app/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://trustreview-eight.vercel.app'}/app/billing?canceled=true`,
      metadata: {
        user_id: user?.id || auth.email,
        plan_id: planId,
        billing_cycle: billingCycle,
        is_temp_session: auth.isTempSession ? 'true' : 'false'
      },
      subscription_data: auth.isTempSession ? undefined : {
        metadata: {
          user_id: user?.id || auth.email,
          plan_id: planId,
          billing_cycle: billingCycle,
          is_temp_session: auth.isTempSession ? 'true' : 'false'
        },
      },
    });

    console.log("✅ Stripe session created:", session.id);

    return NextResponse.json({ sessionId: session.id });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la session de paiement" },
      { status: 500 }
    );
  }
}
