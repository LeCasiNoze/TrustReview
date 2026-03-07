import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { authenticateRequest } from "@/lib/auth-middleware";

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest();
    
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { planId } = await req.json();
    
    if (!planId || planId !== 'offert') {
      return NextResponse.json({ error: "Plan non valide" }, { status: 400 });
    }

    // Pour les sessions temporaires, retourner une réponse factice
    if (auth.isTempSession) {
      return NextResponse.json({
        success: true,
        message: "Plan offert activé",
        plan: {
          id: 'offert',
          name: 'Offert',
          slug: 'offert',
          max_businesses: 1,
          max_qr_codes: 5
        }
      });
    }

    // Pour les sessions Supabase, mettre à jour l'abonnement
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Récupérer le plan offert
    const { data: freePlan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('slug', 'starter')
      .single();

    if (!freePlan) {
      return NextResponse.json({ error: "Plan offert non trouvé" }, { status: 404 });
    }

    // Vérifier si un abonnement existe déjà
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Créer ou mettre à jour l'abonnement
    const { data: subscription, error } = existingSubscription 
      ? await supabase
          .from('subscriptions')
          .update({
            plan_id: freePlan.id,
            status: 'active',
            trial_end: null,
            stripe_subscription_id: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubscription.id)
          .select()
          .single()
      : await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            plan_id: freePlan.id,
            status: 'active',
            trial_end: null,
            stripe_subscription_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

    if (error) {
      console.error("Error switching plan:", error);
      return NextResponse.json({ error: "Erreur lors du changement de plan" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Plan offert activé",
      subscription,
      plan: freePlan
    });

  } catch (error) {
    console.error("Error in switch-plan:", error);
    return NextResponse.json({ 
      error: "Erreur serveur",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
