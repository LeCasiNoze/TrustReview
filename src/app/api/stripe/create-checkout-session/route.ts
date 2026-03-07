import { NextResponse } from "next/server";
import { stripe, STRIPE_PLANS } from "@/lib/stripe";
import { createSupabaseServer } from "@/lib/supabase-server";
import { authenticateRequest } from "@/lib/auth-middleware";

export async function POST(req: Request) {
  try {
    // 1. Validation des variables d'environnement
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("❌ STRIPE_SECRET_KEY manquante");
      return NextResponse.json({ 
        error: "Configuration Stripe incomplète",
        details: "STRIPE_SECRET_KEY non configurée"
      }, { status: 500 });
    }

    // 2. Validation du body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ 
        error: "JSON invalide",
        details: "Le corps de la requête doit être du JSON valide"
      }, { status: 400 });
    }

    const { planId, billingCycle = 'monthly' } = body;
    
    // 3. Validation des paramètres
    if (!planId || typeof planId !== 'string') {
      return NextResponse.json({ 
        error: "Plan ID invalide",
        details: "planId est requis et doit être une chaîne"
      }, { status: 400 });
    }

    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json({ 
        error: "Billing cycle invalide",
        details: "billingCycle doit être 'monthly' ou 'yearly'"
      }, { status: 400 });
    }

    // 4. Validation des plans supportés
    if (!['pro', 'agency'].includes(planId)) {
      return NextResponse.json({ 
        error: "Plan non supporté",
        details: "Les plans supportés sont: pro, agency"
      }, { status: 400 });
    }

    // 5. Authentification
    const auth = await authenticateRequest();
    
    if (!auth.isAuthenticated) {
      return NextResponse.json({ 
        error: "Non authentifié",
        details: "Utilisateur non authentifié"
      }, { status: 401 });
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
    
    // 6. Résolution du Price ID
    const priceIdKey = `${planId}_${billingCycle}` as keyof typeof STRIPE_PLANS;
    const priceId = STRIPE_PLANS[priceIdKey];
    
    console.log("🔍 [STRIPE DEBUG] Résolution Price ID:", {
      planId,
      billingCycle,
      priceIdKey,
      priceId,
      priceIdFormat: priceId?.startsWith('price_') ? 'VALID' : 'INVALID'
    });
    
    if (!priceId) {
      return NextResponse.json({ 
        error: "Plan non configuré",
        details: `Price ID pour ${planId} ${billingCycle} non trouvé dans STRIPE_PLANS`
      }, { status: 500 });
    }
    
    if (!priceId.startsWith('price_')) {
      return NextResponse.json({ 
        error: "Price ID invalide",
        details: `Price ID pour ${planId} ${billingCycle} invalide. Attendu: price_..., reçu: ${priceId}. Mettez à jour src/lib/stripe.ts avec vos vrais Price IDs`
      }, { status: 500 });
    }

    // 7. Créer le client Stripe si nécessaire
    if (!customerId && user) {
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

        // Sauvegarder le customer ID en base pour les sessions Supabase
        if (!auth.isTempSession) {
          const supabase = await createSupabaseServer();
          await supabase
            .from('subscriptions')
            .update({ stripe_customer_id: customerId })
            .eq('user_id', user.id);
        }
      } catch (customerError) {
        console.error("❌ Erreur création client Stripe:", customerError);
        return NextResponse.json({ 
          error: "Erreur création client Stripe",
          details: customerError instanceof Error ? customerError.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    if (!customerId) {
      return NextResponse.json({ 
        error: "Customer ID manquant",
        details: "Impossible de créer ou récupérer le client Stripe"
      }, { status: 500 });
    }

    // 8. Créer la session Checkout
    console.log("🔍 [STRIPE DEBUG] Création session avec:", {
      customerId,
      priceId,
      planId,
      billingCycle,
      priceIdFormat: priceId.startsWith('price_') ? 'VALID' : 'INVALID',
      stripeKeyPresent: !!process.env.STRIPE_SECRET_KEY,
      stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7) + '...'
    });

    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
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

      console.log("✅ [STRIPE DEBUG] Session créée:", session.id);
      return NextResponse.json({ sessionId: session.id });

    } catch (stripeError) {
      console.error("❌ [STRIPE DEBUG] Erreur création session Stripe:", {
        error: stripeError,
        message: stripeError instanceof Error ? stripeError.message : 'Unknown error',
        type: stripeError?.constructor?.name,
        stack: stripeError instanceof Error ? stripeError.stack : undefined,
        requestId: (stripeError as any)?.requestId,
        code: (stripeError as any)?.code,
        statusCode: (stripeError as any)?.statusCode
      });
      
      return NextResponse.json({ 
        error: "Erreur création session Stripe",
        details: stripeError instanceof Error ? stripeError.message : 'Unknown error',
        code: (stripeError as any)?.code,
        requestId: (stripeError as any)?.requestId
      }, { status: 500 });
    }

  } catch (error) {
    console.error("❌ Erreur inattendue:", error);
    return NextResponse.json({ 
      error: "Erreur serveur inattendue",
      details: process.env.NODE_ENV === 'development' ? 
        (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 });
  }
}
