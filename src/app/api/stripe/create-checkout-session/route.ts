import { NextResponse } from "next/server";
import { stripe, STRIPE_PLANS } from "@/lib/stripe";
import { createSupabaseServer } from "@/lib/supabase-server";
import { authenticateRequest } from "@/lib/auth-middleware";

export async function POST(req: Request) {
  try {
    console.log("🔍 [DEBUG] Stripe checkout session request started");
    
    // Vérifier les variables d'environnement critiques
    const stripeKeyPresent = !!process.env.STRIPE_SECRET_KEY;
    const appUrlPresent = !!process.env.NEXT_PUBLIC_APP_URL;
    console.log("🔍 [DEBUG] Env vars check:", {
      stripeKeyPresent,
      appUrlPresent,
      stripeKeyLength: process.env.STRIPE_SECRET_KEY?.length || 0
    });

    if (!stripeKeyPresent) {
      console.error("❌ [DEBUG] STRIPE_SECRET_KEY manquant");
      return NextResponse.json({ error: "Configuration Stripe manquante" }, { status: 500 });
    }

    const { planId, billingCycle = 'monthly' } = await req.json();
    console.log("🔍 [DEBUG] Request body:", { planId, billingCycle });

    if (!planId) {
      console.error("❌ [DEBUG] Plan ID manquant");
      return NextResponse.json({ error: "Plan ID requis" }, { status: 400 });
    }

    // Vérifier l'authentification (Supabase ou temporaire)
    console.log("🔍 [DEBUG] Checking authentication...");
    const auth = await authenticateRequest();
    console.log("🔍 [DEBUG] Auth result:", {
      isAuthenticated: auth.isAuthenticated,
      isTempSession: auth.isTempSession,
      hasEmail: !!auth.email
    });
    
    if (!auth.isAuthenticated) {
      console.error("❌ [DEBUG] User not authenticated");
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
    console.log("🔍 [DEBUG] Resolving price ID...");
    console.log("🔍 [DEBUG] Available STRIPE_PLANS:", Object.keys(STRIPE_PLANS));
    
    let priceId: string;
    switch (planId) {
      case 'pro':
        priceId = billingCycle === 'yearly' ? STRIPE_PLANS.pro_yearly : STRIPE_PLANS.pro_monthly;
        break;
      case 'agency':
        priceId = billingCycle === 'yearly' ? STRIPE_PLANS.agency_yearly : STRIPE_PLANS.agency_monthly;
        break;
      default:
        console.error("❌ [DEBUG] Invalid plan:", planId);
        return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
    }
    
    console.log("🔍 [DEBUG] Resolved price ID:", {
      planId,
      billingCycle,
      priceId,
      priceIdLength: priceId?.length || 0
    });
    
    if (!priceId) {
      console.error("❌ [DEBUG] Price ID is undefined or empty");
      return NextResponse.json({ error: "Price ID non trouvé" }, { status: 500 });
    }

    // Créer le client Stripe si nécessaire
    if (!customerId && user) {
      console.log("🔍 [DEBUG] Creating new Stripe customer...");
      try {
        const customer = await stripe.customers.create({
          email: user.email!,
          name: user.user_metadata?.name || user.email!,
          metadata: {
            user_id: user.id,
            source: 'trustreview'
          }
        });
        customerId = customer.id;
        console.log("✅ [DEBUG] Customer created:", customerId);

        // Sauvegarder le customer ID en base pour les sessions Supabase
        if (!auth.isTempSession) {
          console.log("🔍 [DEBUG] Saving customer ID to database...");
          const supabase = await createSupabaseServer();
          await supabase
            .from('subscriptions')
            .update({ stripe_customer_id: customerId })
            .eq('user_id', user.id);
          console.log("✅ [DEBUG] Customer ID saved to database");
        }
      } catch (customerError) {
        console.error("❌ [DEBUG] Error creating customer:", customerError);
        throw customerError;
      }
    }

    console.log("� [DEBUG] Preparing to create Stripe session:", {
      customerId,
      priceId,
      planId,
      billingCycle,
      isTempSession: auth.isTempSession,
      customerIdPresent: !!customerId
    });

    if (!customerId) {
      console.error("❌ [DEBUG] No customer ID available");
      return NextResponse.json({ error: "Customer ID manquant" }, { status: 500 });
    }

    console.log("🔍 [DEBUG] Creating Stripe checkout session...");
    let session;
    try {
      session = await stripe.checkout.sessions.create({
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
      console.log("✅ [DEBUG] Stripe session created successfully:", session.id);
    } catch (sessionError) {
      console.error("❌ [DEBUG] Error creating Stripe session:", sessionError);
      console.error("❌ [DEBUG] Session error details:", {
        message: sessionError instanceof Error ? sessionError.message : 'Unknown error',
        stack: sessionError instanceof Error ? sessionError.stack : undefined,
        type: sessionError?.constructor?.name
      });
      throw sessionError;
    }

    return NextResponse.json({ sessionId: session.id });

  } catch (error) {
    console.error("❌ [DEBUG] COMPLETE ERROR in checkout session:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error?.constructor?.name,
      raw: error
    });
    
    return NextResponse.json(
      { 
        error: "Erreur lors de la création de la session de paiement",
        debug: process.env.NODE_ENV === 'development' ? {
          message: error instanceof Error ? error.message : 'Unknown error'
        } : undefined
      },
      { status: 500 }
    );
  }
}
