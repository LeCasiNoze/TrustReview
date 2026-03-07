import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { authenticateRequest } from "@/lib/auth-middleware";
import { getTemporaryUserId } from "@/lib/temp-uuid";

export async function GET() {
  try {
    const auth = await authenticateRequest();
    
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Si session temporaire, récupérer les entreprises avec l'UUID déterministe
    if (auth.isTempSession) {
      const deterministicUuid = getTemporaryUserId(auth.email);
      
      const supabase = await createSupabaseServer();
      console.log("🔍 [READ-DEBUG] Requête lecture:", {
        email: auth.email,
        uuid_calculé: deterministicUuid,
        filtre_exact: `owner_user_id = '${deterministicUuid}'`
      });
      
      const { data: businesses } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_user_id', deterministicUuid)
        .order('created_at', { ascending: false });
      
      console.log("🔍 [READ-DEBUG] Résultat lecture:", {
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

    // Get active business
    const { data: activeBusiness } = await supabase
      .from('user_preferences')
      .select('active_business_id')
      .eq('user_id', user.id)
      .single();

    // Toujours retourner une structure cohérente
    return NextResponse.json({
      businesses: Array.isArray(businesses) ? businesses : [],
      activeBusinessId: activeBusiness?.active_business_id || null,
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
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Set active business
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        active_business_id: businessId
      });

    if (error) {
      return NextResponse.json({ error: "Failed to set active business" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting active business:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
