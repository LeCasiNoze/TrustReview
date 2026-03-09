import "server-only";
import { createSupabaseServer } from "@/lib/supabase-server";
import type { RequestIdentity } from "@/lib/request-identity";
import { getRequestIdentity, getSupabaseForIdentity } from "@/lib/request-identity";
import { Subscription, SubscriptionPlan, UserSubscriptionInfo } from "@/lib/types/subscription";
import { QRColorPreset } from "@/lib/types/subscription";
import { calculateRemainingQuotas } from "@/lib/quotas";

export async function getUserSubscriptionInfoServer(identity?: RequestIdentity): Promise<UserSubscriptionInfo | null> {
  const resolvedIdentity = identity ?? await getRequestIdentity();

  if (!resolvedIdentity.isAuthenticated || !resolvedIdentity.userId) {
    return null;
  }

  // Plus de sessions temporaires - uniquement Supabase
  const supabase = resolvedIdentity.supabase ?? await getSupabaseForIdentity(resolvedIdentity);
  const userId = resolvedIdentity.userId;

  // Récupérer l'abonnement
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(`
      *,
      plan:subscription_plans(*)
    `)
    .eq('user_id', userId)
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
          user_id: userId,
          plan_id: starterPlan.id,
          status: 'trialing',
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
    .eq('user_id', userId);

  const { data: businesses } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', userId);

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

  // Utiliser la source de vérité unique pour les quotas
  const quotas = calculateRemainingQuotas(plan.slug, businessCount, qrCount);
  
  return {
    subscription,
    plan,
    features: plan.features,
    canCreateQR: quotas.canCreateQR,
    canCreateBusiness: quotas.canCreateBusiness,
    remainingQRCodes: quotas.remainingQRCodes,
    remainingBusinesses: quotas.remainingBusinesses,
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

export async function getQRColorPresetsServer(identity?: RequestIdentity): Promise<QRColorPreset[]> {
  const resolvedIdentity = identity ?? await getRequestIdentity();

  if (!resolvedIdentity.isAuthenticated || !resolvedIdentity.userId) {
    return [];
  }

  const supabase = resolvedIdentity.supabase ?? await getSupabaseForIdentity(resolvedIdentity);

  const { data: presets } = await supabase
    .from('qr_color_presets')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  return presets || [];
}
