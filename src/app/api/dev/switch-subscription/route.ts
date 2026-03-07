import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    // SÉCURITÉ: Uniquement en développement ou pour l'admin
    const isDev = process.env.NODE_ENV === 'development';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@trustreview.test';
    
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier si c'est l'admin ou si on est en dev
    if (!isDev && user.email !== adminEmail) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { planId, status, billingCycle } = await req.json();

    // Validation des inputs
    const validPlans = ['starter', 'pro', 'agency'];
    const validStatuses = ['trialing', 'active', 'canceled', 'past_due'];
    const validCycles = ['monthly', 'yearly'];

    if (!validPlans.includes(planId)) {
      return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
    }

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Status invalide" }, { status: 400 });
    }

    if (!validCycles.includes(billingCycle)) {
      return NextResponse.json({ error: "Cycle invalide" }, { status: 400 });
    }

    // Récupérer le plan
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('slug', planId)
      .single();

    if (!plan) {
      return NextResponse.json({ error: "Plan non trouvé" }, { status: 404 });
    }

    // Calculer les dates en fonction du status
    let trial_end = null;
    let current_period_end = null;

    if (status === 'trialing') {
      trial_end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 jours
    } else if (status === 'active') {
      current_period_end = new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString();
    }

    // Mettre à jour ou créer l'abonnement
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    let subscription;
    if (existingSubscription) {
      // Mettre à jour l'abonnement existant
      const { data } = await supabase
        .from('subscriptions')
        .update({
          plan_id: plan.id,
          status,
          trial_end,
          current_period_end,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();
      subscription = data;
    } else {
      // Créer un nouvel abonnement
      const { data } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan_id: plan.id,
          status,
          trial_end,
          current_period_end,
          stripe_subscription_id: `test_${planId}_${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      subscription = data;
    }

    console.log(`🧪 [DEV] Abonnement mis à jour: ${user.email} -> ${planId} (${status})`);

    return NextResponse.json({ 
      success: true,
      subscription,
      message: `Abonnement mis à jour vers ${plan.name} (${status})`
    });

  } catch (error) {
    console.error('Error switching subscription:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to switch subscription"
    }, { status: 500 });
  }
}
