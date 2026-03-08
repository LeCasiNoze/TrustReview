import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseServiceClient } from "@/lib/supabase-server";
import { authenticateRequest } from "@/lib/auth-middleware";
import { getTemporaryUserId } from "@/lib/temp-uuid";
import { getActiveBusiness, setActiveBusiness, cleanupMultipleActiveBusinesses } from "@/lib/active-business";

export async function GET() {
  try {
    const auth = await authenticateRequest();
    
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Si session temporaire, récupérer les entreprises avec l'UUID déterministe
    if (auth.isTempSession) {
      const deterministicUuid = getTemporaryUserId(auth.email);
      
      const supabase = auth.isTempSession ? await createSupabaseServiceClient() : await createSupabaseServer();
      console.log("🔍 [BUSINESS-READ-DEBUG] READ ENDPOINT:", {
        sessionType: auth.isTempSession ? "TEMPORARY" : "SUPABASE",
        clientType: auth.isTempSession ? "createSupabaseServiceClient()" : "createSupabaseServer()",
        email: auth.email,
        userId: deterministicUuid,
        requete: `SELECT * FROM businesses WHERE owner_user_id = '${deterministicUuid}'`
      });
      
      const { data: businesses } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_user_id', deterministicUuid)
        .order('created_at', { ascending: false });
      
      console.log("🔍 [BUSINESS-READ-DEBUG] RÉSULTAT READ ENDPOINT:", {
        nombreEntreprises: businesses?.length || 0,
        entreprises: businesses?.map(b => ({
          id: b.id,
          name: b.name,
          owner_user_id: b.owner_user_id
        }))
      });
      
      return NextResponse.json({
        businesses: Array.isArray(businesses) ? businesses : [],
        activeBusinessId: null,
        canCreateMore: true,
        remainingSlots: null
      });
    }

    // Authentification Supabase normale
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Get businesses
    const { data: businesses } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: false });

    // Nettoyer les entreprises actives multiples (sécurité)
    await cleanupMultipleActiveBusinesses(user.id, false);

    // Récupérer l'entreprise active avec la source de vérité unique
    const activeBusinessData = await getActiveBusiness();

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
    const { businessId } = await req.json();
    
    if (!businessId) {
      return NextResponse.json({ error: "Business ID required" }, { status: 400 });
    }

    // Utiliser la source de vérité unique pour l'activation
    await setActiveBusiness(businessId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting active business:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
