import { createSupabaseServer } from './supabase-server';
import { Subscription, SubscriptionPlan, UserSubscriptionInfo, QRColorPreset } from './types/subscription';

export async function getUserSubscription(): Promise<Subscription | null> {
  const supabase = await createSupabaseServer();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      plan:subscription_plans(*)
    `)
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error fetching subscription:', error);
    return null;
  }

  return data;
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const supabase = await createSupabaseServer();
  
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    console.error('Error fetching plans:', error);
    return [];
  }

  return data || [];
}

export async function getQRColorPresets(): Promise<QRColorPreset[]> {
  const supabase = await createSupabaseServer();
  
  const { data, error } = await supabase
    .from('qr_color_presets')
    .select('*')
    .order('sort_order');

  if (error) {
    console.error('Error fetching color presets:', error);
    return [];
  }

  return data || [];
}

export async function getUserSubscriptionInfo(): Promise<UserSubscriptionInfo> {
  const subscription = await getUserSubscription();
  
  if (!subscription) {
    // Créer un abonnement starter par défaut
    const newSubscription = await createDefaultSubscription();
    return getUserSubscriptionInfo(); // Récursif avec le nouvel abonnement
  }

  const plan = subscription.plan || null;
  const isTrialActive = subscription.status === 'trialing' && subscription.trial_end;
  const trialDaysLeft = isTrialActive && subscription.trial_end ? 
    Math.ceil((new Date(subscription.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  // Compter les QR codes et entreprises existants
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not found');
  }

  const [qrCountResult, businessCountResult] = await Promise.all([
    supabase.from('qr_codes').select('id', { count: 'exact' }).eq('business_id', (await supabase.from('businesses').select('id').eq('owner_user_id', user.id).single()).data?.id || ''),
    supabase.from('businesses').select('id', { count: 'exact' }).eq('owner_user_id', user.id)
  ]);

  const currentQRCodes = qrCountResult.count || 0;
  const currentBusinesses = businessCountResult.count || 0;

  const maxQRCodes = plan?.max_qr_codes ?? null;
  const maxBusinesses = plan?.max_businesses ?? null;

  return {
    subscription,
    plan,
    canCreateQR: maxQRCodes === null || currentQRCodes < maxQRCodes,
    canCreateBusiness: maxBusinesses === null || currentBusinesses < maxBusinesses,
    remainingQRCodes: maxQRCodes === null ? null : Math.max(0, maxQRCodes - currentQRCodes),
    remainingBusinesses: maxBusinesses === null ? null : Math.max(0, maxBusinesses - currentBusinesses),
    isTrialActive: Boolean(isTrialActive),
    trialDaysLeft: trialDaysLeft,
    hasFeature: (feature: string) => {
      return Boolean(plan?.features?.[feature]);
    }
  };
}

async function createDefaultSubscription(): Promise<Subscription> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not found');
  }

  // Récupérer le plan starter
  const { data: starterPlan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('slug', 'starter')
    .single();

  if (!starterPlan) {
    throw new Error('Starter plan not found');
  }

  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + starterPlan.trial_days);

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: user.id,
      plan_id: starterPlan.id,
      status: 'trialing',
      trial_end: trialEnd.toISOString(),
      current_period_end: trialEnd.toISOString()
    })
    .select(`
      *,
      plan:subscription_plans(*)
    `)
    .single();

  if (error) {
    console.error('Error creating default subscription:', error);
    throw error;
  }

  return data;
}

export async function updateSubscriptionPlan(planId: string): Promise<Subscription> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not found');
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      plan_id: planId,
      status: 'active', // Manuel pour le moment
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
    .select(`
      *,
      plan:subscription_plans(*)
    `)
    .single();

  if (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }

  return data;
}
