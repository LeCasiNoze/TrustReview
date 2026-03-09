import { NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/request-identity";
import { getQRColorPresetsServer, getUserSubscriptionInfoServer } from "@/lib/subscription.server";

export async function GET() {
  try {
    const identity = await getRequestIdentity();

    if (!identity.isAuthenticated || !identity.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [presets, subscriptionInfo] = await Promise.all([
      getQRColorPresetsServer(identity),
      getUserSubscriptionInfoServer(identity)
    ]);

    // Filtrer les presets selon le plan
    const availablePresets = presets.filter(preset => {
      if (!preset.is_premium) return true;
      return subscriptionInfo?.hasFeature?.('qr_customization') ?? false;
    });

    return NextResponse.json({ 
      presets: availablePresets,
      canUsePremium: subscriptionInfo?.hasFeature?.('qr_customization') ?? false
    });
  } catch (error) {
    console.error('Error fetching color presets:', error);
    return NextResponse.json({ error: "Failed to fetch color presets" }, { status: 500 });
  }
}
