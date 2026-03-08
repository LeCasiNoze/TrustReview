import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseServiceClient } from "@/lib/supabase-server";
import { authenticateRequest } from "@/lib/auth-middleware";
import { getTemporaryUserId } from "@/lib/temp-uuid";

export async function GET() {
  try {
    // Vérifier l'authentification (Supabase ou temporaire)
    const auth = await authenticateRequest();
    
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Business API - Authenticated:", { email: auth.email, isTemp: auth.isTempSession });

    // Si session temporaire, récupérer la vraie entreprise avec UUID déterministe
    if (auth.isTempSession) {
      const supabase = await createSupabaseServiceClient();
      const userId = getTemporaryUserId(auth.email);
      
      console.log("🔍 [BUSINESS-CURRENT-DEBUG] Session temporaire:", {
        email: auth.email,
        userId: userId,
        clientType: "createSupabaseServiceClient()"
      });
      
      const { data: business, error } = await supabase
        .from("businesses")
        .select("id, name, slug, google_review_url, threshold_positive, is_active, logo_url, notification_email, notif_new_review, notif_low_rating")
        .eq("owner_user_id", userId)
        .single();
      
      if (error || !business) {
        console.log("🔍 [BUSINESS-CURRENT-DEBUG] Aucune entreprise trouvée pour session temporaire");
        return NextResponse.json({ error: "Business not found" }, { status: 404 });
      }
      
      console.log("🔍 [BUSINESS-CURRENT-DEBUG] Entreprise trouvée pour session temporaire:", business.id);
      return NextResponse.json(business);
    }

    // Authentification Supabase normale
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    console.log("Business API - User authenticated:", user.id);

    // Get the business for this user
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, name, slug, google_review_url, threshold_positive, is_active, logo_url, notification_email, notif_new_review, notif_low_rating")
      .eq("owner_user_id", user.id)
      .single();

    if (businessError) {
      console.error("Business API - Business fetch error:", businessError);
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (!business) {
      console.log("Business API - No business found for user:", user.id);
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    console.log("Business API - Business found:", business.id, business.name);

    return NextResponse.json(business);
  } catch (error) {
    console.error("Business API - Error fetching business:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
