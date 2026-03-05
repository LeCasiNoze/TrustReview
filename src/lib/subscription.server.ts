import "server-only";
import { createSupabaseServer } from "./supabase-server";
import { UserSubscriptionInfo, SubscriptionPlan } from "./types/subscription";

export async function getUserSubscriptionInfoServer(): Promise<UserSubscriptionInfo | null> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  // Récupérer l'abonnement
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(`
      *,
      plan:subscription_plans(*)
    `)
    .eq('user_id', user.id)
    .single();

  // Récupérer le plan
  let plan = subscription?.plan;
  if (!plan && subscription?.plan_id) {
    const { data: planData } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', subscription.plan_id)
      .single();
    plan = planData;
  }

  // Créer un abonnement par défaut si aucun n'existe
  if (!subscription) {
    const { data: starterPlan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('slug', 'starter')
      .single();

    if (starterPlan) {
      const { data: newSubscription } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan_id: starterPlan.id,
          status: 'trial',
          trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 jours
          stripe_subscription_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (newSubscription) {
        return {
          subscription: {
            ...newSubscription,
            plan: starterPlan
          },
          plan: starterPlan,
          features: starterPlan.features,
          canCreateQR: true,
          canCreateBusiness: starterPlan.max_businesses === null || starterPlan.max_businesses > 0,
          remainingQRCodes: starterPlan.max_qr_codes,
          remainingBusinesses: starterPlan.max_businesses,
          isTrialActive: true,
          trialDaysLeft: 7,
          hasFeature: (feature: string) => starterPlan.features[feature] || false
        };
      }
    }
  }

  if (!subscription || !plan) return null;

  // Calculer l'utilisation
  const { data: qrCodes } = await supabase
    .from('qr_codes')
    .select('id')
    .eq('user_id', user.id);

  const { data: businesses } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id);

  const qrCount = qrCodes?.length || 0;
  const businessCount = businesses?.length || 0;

  // Calculer les jours d'essai restants
  let trialDaysLeft = 0;
  if (subscription.trial_end && subscription.status === 'trial') {
    const trialEnd = new Date(subscription.trial_end);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    trialDaysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  return {
    subscription,
    plan,
    features: plan.features,
    canCreateQR: plan.max_qr_codes === null || plan.max_qr_codes > qrCount,
    canCreateBusiness: plan.max_businesses === null || plan.max_businesses > businessCount,
    remainingQRCodes: plan.max_qr_codes ? Math.max(0, plan.max_qr_codes - qrCount) : null,
    remainingBusinesses: plan.max_businesses ? Math.max(0, plan.max_businesses - businessCount) : null,
    isTrialActive: subscription.status === 'trial' && trialDaysLeft > 0,
    trialDaysLeft,
    hasFeature: (feature: string) => plan.features[feature] || false
  };
}

export async function getSubscriptionPlansServer(): Promise<SubscriptionPlan[]> {
  const supabase = await createSupabaseServer();
  
  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  return plans || [];
}

export async function getBillingDataServer() {
  const [info, plans] = await Promise.all([
    getUserSubscriptionInfoServer(),
    getSubscriptionPlansServer()
  ]);

  return { info, plans };
}
