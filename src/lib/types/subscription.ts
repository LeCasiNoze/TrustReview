export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_monthly: number; // en centimes
  price_yearly: number; // en centimes
  trial_days: number;
  max_qr_codes: number | null;
  max_businesses: number | null;
  features: Record<string, boolean>;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: 'trialing' | 'active' | 'canceled' | 'past_due' | 'unpaid';
  trial_end: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan; // jointure optionnelle
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  category: string;
  created_at: string;
}

export interface QRColorPreset {
  id: string;
  name: string;
  category: 'professionnel' | 'marque' | 'fun';
  background_color: string;
  foreground_color: string;
  is_premium: boolean;
  sort_order: number;
  created_at: string;
}

export interface UserSubscriptionInfo {
  subscription: Subscription | null;
  plan: SubscriptionPlan | null;
  canCreateQR: boolean;
  canCreateBusiness: boolean;
  remainingQRCodes: number | null;
  remainingBusinesses: number | null;
  isTrialActive: boolean;
  trialDaysLeft: number | null;
  hasFeature: (feature: string) => boolean;
}
