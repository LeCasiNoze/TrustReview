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

    // Transformer pour le frontend
    return NextResponse.json({
      canAccess: true,
      subscriptionStatus: subscriptionInfo.subscription?.status || 'active',
      plan: subscriptionInfo.plan,
      canCreateQR: subscriptionInfo.canCreateQR,
      canCreateBusiness: subscriptionInfo.canCreateBusiness,
      remainingQRCodes: subscriptionInfo.remainingQRCodes,
      remainingBusinesses: subscriptionInfo.remainingBusinesses,
      isTrialActive: subscriptionInfo.isTrialActive,
      trialDaysLeft: subscriptionInfo.trialDaysLeft
    });
  } catch (error) {
    console.error('Error fetching subscription info:', error);
    return NextResponse.json({ error: "Failed to fetch subscription info" }, { status: 500 });
  }
}
