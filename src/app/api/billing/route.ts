import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { authenticateRequest } from "@/lib/auth-middleware";

export async function GET() {
  try {
    const auth = await authenticateRequest();
    
    if (!auth.isAuthenticated) {
      return NextResponse.json({
        isAuthenticated: false,
        hasSubscriptionActive: false,
        isTrialActive: false,
        isTrialAvailable: true,
        subscriptionStatus: 'none',
        needsOnboarding: false
      });
    }

    // Session temporaire = créer un trial factice
    if (auth.isTempSession) {
      const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const trialDaysLeft = 7; // Toujours 7 jours pour les sessions temporaires
      return NextResponse.json({
        isAuthenticated: true,
        hasSubscriptionActive: true,
        isTrialActive: true,
        trialDaysLeft,
        isTrialAvailable: false,
        subscriptionStatus: 'trialing',
        needsOnboarding: false,
        subscription: {
          id: 'temp-trial',
          status: 'trialing',
          trial_end: trialEnd.toISOString(),
          created_at: new Date().toISOString()
        },
        plan: {
          id: 'starter',
          name: 'Essai gratuit',
          slug: 'starter',
          max_businesses: 1,
          max_qr_codes: 5
        }
      });
    }

    // Authentification Supabase normale
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({
        isAuthenticated: false,
        hasSubscriptionActive: false,
        isTrialActive: false,
        isTrialAvailable: true,
        subscriptionStatus: 'none',
        needsOnboarding: false
      });
    }
    
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
      plan: subscription?.plan || null
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
