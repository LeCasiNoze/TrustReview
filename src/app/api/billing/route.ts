import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET() {
  try {
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

    return NextResponse.json({
      isAuthenticated: true,
      hasSubscriptionActive,
      isTrialActive,
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
