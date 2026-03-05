import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { STRIPE_PLANS } from "@/lib/stripe";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Récupérer le plan Pro (trial)
    const { data: proPlan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('slug', 'pro')
      .single();

    if (!proPlan) {
      return NextResponse.json({ error: "Pro plan not found" }, { status: 404 });
    }

    // Créer ou récupérer le client Stripe
    let customerId = user.user_metadata?.stripe_customer_id;
    
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

      // Mettre à jour les métadonnées utilisateur via la table profiles
      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString()
        });
    }

    // Créer une session de checkout avec trial 7 jours
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: STRIPE_PLANS.pro_monthly,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          user_id: user.id,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/billing?canceled=true`,
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    });

    // Créer l'abonnement dans la base de données (statut en attente)
    await supabase
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        plan_id: proPlan.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: null, // Sera mis à jour par le webhook
        status: 'trialing',
        trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id
    });

  } catch (error) {
    console.error("Error starting trial:", error);
    return NextResponse.json({ 
      error: "Failed to start trial",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
