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
    
    // Vérifier les limites d'abonnement avant création
    const businessManager = await getUserBusinesses();
    if (!businessManager.canCreateMore) {
      return NextResponse.json({ 
        error: `Limite d'entreprises atteinte (${businessManager.businesses.length}/${businessManager.remainingSlots === null ? '∞' : businessManager.businesses.length + businessManager.remainingSlots})` 
      }, { status: 400 });
    }

    const business = await createBusiness(body);
    
    return NextResponse.json({ 
      success: true, 
      business,
      message: "Entreprise créée avec succès"
    });

  } catch (error) {
    console.error('Error creating business:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to create business" 
    }, { status: 500 });
  }
}
