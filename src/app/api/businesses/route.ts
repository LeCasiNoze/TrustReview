import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { createBusiness, getUserBusinesses } from "@/lib/business-manager";

export async function GET() {
  try {
    const businessManager = await getUserBusinesses();
    return NextResponse.json(businessManager);
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return NextResponse.json({ error: "Failed to fetch businesses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("🏢 [BUSINESSES] Création entreprise demandée:", body);
    
    // Vérifier les limites d'abonnement avant création
    console.log("🏢 [BUSINESSES] Vérification quotas...");
    const businessManager = await getUserBusinesses();
    console.log("🏢 [BUSINESSES] Business manager:", {
      businessesCount: businessManager.businesses.length,
      canCreateMore: businessManager.canCreateMore,
      remainingSlots: businessManager.remainingSlots
    });
    
    if (!businessManager.canCreateMore) {
      console.log("🏢 [BUSINESSES] Limite atteinte, refus création");
      return NextResponse.json({ 
        error: `Limite d'entreprises atteinte (${businessManager.businesses.length}/${businessManager.remainingSlots === null ? '∞' : businessManager.businesses.length + businessManager.remainingSlots})` 
      }, { status: 400 });
    }

    console.log("🏢 [BUSINESSES] Création entreprise autorisée...");
    const business = await createBusiness(body);
    console.log("🏢 [BUSINESSES] Entreprise créée avec succès:", business.id);
    
    return NextResponse.json({ 
      success: true, 
      business,
      message: "Entreprise créée avec succès"
    });

  } catch (error) {
    console.error('🏢 [BUSINESSES] Error creating business:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to create business",
      details: process.env.NODE_ENV === 'development' ? {
        stack: error instanceof Error ? error.stack : undefined
      } : undefined
    }, { status: 500 });
  }
}
