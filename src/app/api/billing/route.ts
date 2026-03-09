import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getRequestIdentity } from "@/lib/request-identity";

export async function GET() {
  try {
    const identity = await getRequestIdentity();
    
    if (!identity.isAuthenticated) {
      return NextResponse.json({
        isAuthenticated: false,
        hasSubscriptionActive: false,
        isTrialActive: false,
        isTrialAvailable: true,
        subscriptionStatus: 'none',
        needsOnboarding: false
      });
    }

    // Plus de sessions temporaires - uniquement Supabase
    const supabase = identity.supabase ?? await createSupabaseServer();
    const user = identity.user;
    
    // Récupérer l'abonnement
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', user.id)
      .single();

    // Déterminer le statut
    const hasSubscriptionActive = subscription && ['active', 'trialing'].includes(subscription.status);
    const isTrialActive = subscription?.status === 'trialing' && subscription.trial_end && new Date(subscription.trial_end) > new Date();
    const isTrialAvailable = !subscription || subscription.status === 'none';
    const needsOnboarding = !subscription || (!hasSubscriptionActive && !isTrialActive);

    // Calculer les jours restants du trial
    let trialDaysLeft = 0;
    if (isTrialActive && subscription?.trial_end) {
      const trialEnd = new Date(subscription.trial_end);
      const now = new Date();
      const diffTime = trialEnd.getTime() - now.getTime();
      trialDaysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    return NextResponse.json({
      isAuthenticated: true,
      hasSubscriptionActive,
      isTrialActive,
      trialDaysLeft,
      isTrialAvailable,
      subscriptionStatus: subscription?.status || 'none',
      needsOnboarding,
      subscription,
      plan: subscription?.plan || null,
      userEmail: user.email // Ajout pour debug admin
    });

  } catch (error) {
    console.error("Error fetching billing data:", error);
    
    // En cas d'erreur, retourner un objet safe plutôt que 500
    return NextResponse.json({
      isAuthenticated: false,
      hasSubscriptionActive: false,
      isTrialActive: false,
      isTrialAvailable: true,
      subscriptionStatus: 'none',
      needsOnboarding: false,
      error: "Failed to fetch billing data"
    });
  }
}
