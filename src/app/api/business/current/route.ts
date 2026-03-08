import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseServiceClient } from "@/lib/supabase-server";
import { authenticateRequest } from "@/lib/auth-middleware";
import { getTemporaryUserId } from "@/lib/temp-uuid";
import { getActiveBusiness } from "@/lib/active-business";

export async function GET() {
  try {
    // Vérifier l'authentification (Supabase ou temporaire)
    const auth = await authenticateRequest();
    
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Business API - Authenticated:", { email: auth.email, isTemp: auth.isTempSession });

    // Utiliser la source de vérité unique pour l'entreprise active
    const business = await getActiveBusiness();

    if (!business) {
      console.log("🔍 [BUSINESS-CURRENT] Aucune entreprise active trouvée");
      return NextResponse.json({ error: "No active business found" }, { status: 404 });
    }

    console.log("🔍 [BUSINESS-CURRENT] Entreprise active trouvée:", business.id, business.name);
    return NextResponse.json(business);
  } catch (error) {
    console.error("Business API - Error fetching business:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
