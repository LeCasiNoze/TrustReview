/**
 * Source de vérité pour les infos d'abonnement côté client
 * Utilise subscription.server.ts (non déprécié)
 */
import { NextResponse } from "next/server";
import { getUserSubscriptionInfoServer } from "@/lib/subscription.server";

export async function GET() {
  try {
    const subscriptionInfo = await getUserSubscriptionInfoServer();
    
    if (!subscriptionInfo) {
      return NextResponse.json({ 
        error: "User not found" 
      }, { status: 404 });
    }

    const planData = subscriptionInfo.plan ? {
      slug: subscriptionInfo.plan.slug ?? null,
      name: subscriptionInfo.plan.name ?? null,
      max_qr_codes: subscriptionInfo.plan.max_qr_codes ?? null,
      max_businesses: subscriptionInfo.plan.max_businesses ?? null
    } : null;

    // Transformer pour le frontend (shape stable)
    return NextResponse.json({
      canAccess: true,
      subscriptionStatus: subscriptionInfo.subscription?.status || 'active',
      plan: planData,
      canCreateQR: Boolean(subscriptionInfo.canCreateQR),
      canCreateBusiness: Boolean(subscriptionInfo.canCreateBusiness),
      remainingQRCodes: subscriptionInfo.remainingQRCodes ?? null,
      remainingBusinesses: subscriptionInfo.remainingBusinesses ?? null,
      isTrialActive: Boolean(subscriptionInfo.isTrialActive),
      trialDaysLeft: subscriptionInfo.trialDaysLeft ?? 0
    });
  } catch (error) {
    console.error('Error fetching subscription info:', error);
    return NextResponse.json({ error: "Failed to fetch subscription info" }, { status: 500 });
  }
}
