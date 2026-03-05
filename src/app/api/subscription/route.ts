import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getUserSubscriptionInfo, updateSubscriptionPlan } from "@/lib/subscription";

export async function GET() {
  try {
    const subscriptionInfo = await getUserSubscriptionInfo();
    return NextResponse.json(subscriptionInfo);
  } catch (error) {
    console.error('Error fetching subscription info:', error);
    return NextResponse.json({ error: "Failed to fetch subscription info" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { planId } = await req.json();
    
    if (!planId) {
      return NextResponse.json({ error: "planId is required" }, { status: 400 });
    }

    // Pour le moment, on permet le changement manuel (à remplacer par Stripe plus tard)
    const subscription = await updateSubscriptionPlan(planId);
    
    return NextResponse.json({ 
      success: true, 
      subscription,
      message: "Abonnement mis à jour manuellement" 
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}
