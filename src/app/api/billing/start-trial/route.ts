import { NextResponse } from "next/server";
import { getRequestIdentity, getSupabaseForIdentity } from "@/lib/request-identity";

export async function POST(req: Request) {
  try {
    const identity = await getRequestIdentity();
    
    if (!identity.isAuthenticated || !identity.userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { planId } = await req.json();
    
    if (!planId || planId !== 'pro') {
      return NextResponse.json({ error: "Plan non valide" }, { status: 400 });
    }

    // Plus de sessions temporaires - uniquement Supabase
    const supabase = await getSupabaseForIdentity(identity);
    
    // Vérifier si un abonnement existe déjà
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', identity.userId)
      .single();

    if (existingSubscription && existingSubscription.status !== 'none') {
      return NextResponse.json({ error: "Un abonnement existe déjà" }, { status: 400 });
    }

    // Récupérer le plan Pro
    const { data: proPlan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('slug', 'pro')
      .single();

    if (!proPlan) {
      return NextResponse.json({ error: "Plan Pro non trouvé" }, { status: 404 });
    }

    // Créer ou mettre à jour l'abonnement avec le trial
    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const { data: subscription, error } = existingSubscription 
      ? await supabase
          .from('subscriptions')
          .update({
            plan_id: proPlan.id,
            status: 'trialing',
            trial_end: trialEnd.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubscription.id)
          .select()
          .single()
      : await supabase
          .from('subscriptions')
          .insert({
            user_id: identity.userId,
            plan_id: proPlan.id,
            status: 'trialing',
            trial_end: trialEnd.toISOString(),
            stripe_subscription_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

    if (error) {
      console.error("Error creating trial:", error);
      return NextResponse.json({ error: "Erreur lors de la création du trial" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Essai gratuit démarré avec succès",
      subscription,
      plan: proPlan
    });

  } catch (error) {
    console.error("Error in start-trial:", error);
    return NextResponse.json({ 
      error: "Erreur serveur",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
