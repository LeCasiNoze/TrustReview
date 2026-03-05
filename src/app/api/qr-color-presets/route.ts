import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getQRColorPresets, getUserSubscriptionInfo } from "@/lib/subscription";

export async function GET() {
  try {
    const [presets, subscriptionInfo] = await Promise.all([
      getQRColorPresets(),
      getUserSubscriptionInfo()
    ]);

    // Filtrer les presets selon le plan
    const availablePresets = presets.filter(preset => {
      if (!preset.is_premium) return true;
      return subscriptionInfo.hasFeature('qr_customization');
    });

    return NextResponse.json({ 
      presets: availablePresets,
      canUsePremium: subscriptionInfo.hasFeature('qr_customization')
    });
  } catch (error) {
    console.error('Error fetching color presets:', error);
    return NextResponse.json({ error: "Failed to fetch color presets" }, { status: 500 });
  }
}
