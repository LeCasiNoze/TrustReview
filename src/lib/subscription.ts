// ⚠️ DEPRECATED: Use subscription.server.ts for server-side logic
// This file is kept for backward compatibility but should not be used
import { Subscription, SubscriptionPlan, UserSubscriptionInfo, QRColorPreset } from './types/subscription';

// Client-side functions - no server imports
export function createMockSubscriptionInfo(): UserSubscriptionInfo {
  return {
    subscription: null,
    plan: null,
    features: {},
    canCreateQR: false,
    canCreateBusiness: false,
    remainingQRCodes: 0,
    remainingBusinesses: 0,
    isTrialActive: false,
    trialDaysLeft: 0,
    hasFeature: () => false
  };
}

// ⚠️ DEPRECATED - Use subscription.server.ts instead
export async function getUserSubscription(): Promise<Subscription | null> {
  console.warn('getUserSubscription is deprecated. Use subscription.server.ts');
  return null;
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  console.warn('getSubscriptionPlans is deprecated. Use subscription.server.ts');
  return [];
}

export async function getUserSubscriptionInfo(): Promise<UserSubscriptionInfo | null> {
  console.warn('getUserSubscriptionInfo is deprecated. Use subscription.server.ts');
  return createMockSubscriptionInfo();
}

export async function getQRColorPresets(): Promise<QRColorPreset[]> {
  console.warn('getQRColorPresets is deprecated. Use subscription.server.ts');
  return [];
}

export async function createDefaultSubscription(userId: string): Promise<boolean> {
  console.warn('createDefaultSubscription is deprecated. Use subscription.server.ts');
  return false;
}

export async function updateSubscriptionPlan(planId: string): Promise<boolean> {
  console.warn('updateSubscriptionPlan is deprecated. Use subscription.server.ts');
  return false;
}
