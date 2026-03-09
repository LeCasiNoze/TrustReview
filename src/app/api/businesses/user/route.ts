import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseServiceClient } from "@/lib/supabase-server";
import { getRequestIdentity } from "@/lib/request-identity";
import { getActiveBusiness, setActiveBusiness, cleanupMultipleActiveBusinesses } from "@/lib/active-business";

export async function GET() {
  try {
    const identity = await getRequestIdentity();
    
    if (!identity.isAuthenticated || !identity.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = identity.isTempSession
      ? await createSupabaseServiceClient()
      : identity.supabase ?? await createSupabaseServer();

    // Get businesses
    const { data: businesses } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_user_id', identity.userId)
      .order('created_at', { ascending: false });

    // Nettoyer les entreprises actives multiples (sécurité)
    await cleanupMultipleActiveBusinesses(identity.userId, identity.isTempSession);

    // Récupérer l'entreprise active avec la source de vérité unique
    const activeBusinessData = await getActiveBusiness(identity);

    return NextResponse.json({
      businesses: Array.isArray(businesses) ? businesses : [],
      activeBusinessId: activeBusinessData?.id || null,
      activeBusiness: activeBusinessData,
      canCreateMore: true, // TODO: Calculer selon l'abonnement
      remainingSlots: null // TODO: Calculer selon l'abonnement
    });
  } catch (error) {
    console.error("Error fetching businesses:", error);
    // Même en cas d'erreur, retourner une structure safe pour éviter le crash
    return NextResponse.json({
      businesses: [],
      activeBusinessId: null,
      canCreateMore: true,
      remainingSlots: null
    }, { status: 200 }); // 200 pour éviter le crash côté client
  }
}

export async function POST(req: Request) {
  try {
    const identity = await getRequestIdentity();
    
    if (!identity.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId } = await req.json();
    
    if (!businessId) {
      return NextResponse.json({ error: "Business ID required" }, { status: 400 });
    }

    await setActiveBusiness(businessId, identity);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting active business:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
