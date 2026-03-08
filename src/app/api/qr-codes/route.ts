import { createSupabaseServer, createSupabaseServiceClient } from '@/lib/supabase-server'
import { requireUserServer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from "@/lib/auth-middleware";
import { getTemporaryUserId } from "@/lib/temp-uuid";
import { getPlanQuotas, getQuotaLimitMessage } from "@/lib/quotas";
import { getActiveBusiness } from "@/lib/active-business";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Si session temporaire, récupérer les vrais QR codes avec UUID déterministe
    if (auth.isTempSession) {
      const supabase = await createSupabaseServiceClient();
      const userId = getTemporaryUserId(auth.email);
      
      console.log("🔍 [QR-CODES-DEBUG] Session temporaire:", {
        email: auth.email,
        userId: userId,
        clientType: "createSupabaseServiceClient()"
      });
      
      // Get business for the user
      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_user_id', userId)
        .single()
      
      if (!business) {
        console.log("🔍 [QR-CODES-DEBUG] Aucune entreprise trouvée pour session temporaire");
        return NextResponse.json({ qrCodes: [] });
      }
      
      console.log("🔍 [QR-CODES-DEBUG] Entreprise trouvée pour session temporaire:", business.id);
      
      // Get QR codes for the business
      const { data: qrCodes, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error("🔍 [QR-CODES-DEBUG] Erreur récupération QR codes:", error);
        return NextResponse.json({ qrCodes: [] });
      }
      
      console.log("🔍 [QR-CODES-DEBUG] QR codes trouvés:", qrCodes?.length || 0);
      return NextResponse.json({ qrCodes: qrCodes || [] });
    }

    // Authentification Supabase normale
    const user = await requireUserServer()
    const supabase = await createSupabaseServer()
    
    // Utiliser la source de vérité unique : entreprise active
    const activeBusiness = await getActiveBusiness();
    
    if (!activeBusiness) {
      console.log("🔍 [QR-CODES-GET] Aucune entreprise active trouvée");
      return NextResponse.json({ qrCodes: [] });
    }
    
    console.log("🔍 [QR-CODES-GET] Utilisation entreprise active:", {
      businessId: activeBusiness.id,
      businessName: activeBusiness.name
    });
    
    // Get QR codes for the ACTIVE business
    const { data: qrCodes, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('business_id', activeBusiness.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({ qrCodes })
  } catch (error) {
    if (error instanceof Error && error.message.includes('User not found')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUserServer()
    const supabase = await createSupabaseServer()
    
    const formData = await request.formData()
    
    // Utiliser la source de vérité unique : entreprise active
    const activeBusiness = await getActiveBusiness();
    
    if (!activeBusiness) {
      console.log("🔍 [QR-CODES-POST] Aucune entreprise active trouvée");
      return NextResponse.json({ error: 'No active business found' }, { status: 404 });
    }
    
    console.log("🔍 [QR-CODES-POST] Utilisation entreprise active:", {
      businessId: activeBusiness.id,
      businessName: activeBusiness.name
    });
    
    // Check QR code limit based on user's plan (ACTIVE BUSINESS)
    const { data: existingQRCodes } = await supabase
      .from('qr_codes')
      .select('id')
      .eq('business_id', activeBusiness.id)
    
    // Get user's subscription info to check quotas
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    // Get subscription plan
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:subscription_plans(slug, max_qr_codes)
      `)
      .eq('user_id', authUser.id)
      .single();
    
    // Utiliser la source de vérité unique pour les quotas
    const planQuotas = getPlanQuotas(subscription?.plan?.slug);
    const currentQRCodes = existingQRCodes?.length || 0;
    
    console.log("🔍 [QR-CODES-QUOTA-DEBUG] Quotas check:", {
      planSlug: subscription?.plan?.slug,
      maxQRCodes: planQuotas.max_qr_codes,
      currentQRCodes: currentQRCodes,
      canCreate: planQuotas.max_qr_codes === null || currentQRCodes < planQuotas.max_qr_codes
    });
    
    // Check limit using unified logic
    if (planQuotas.max_qr_codes !== null && currentQRCodes >= planQuotas.max_qr_codes) {
      const message = getQuotaLimitMessage('create_qr', subscription?.plan?.slug, 0);
      return NextResponse.json({ 
        error: 'QR code limit reached', 
        details: message
      }, { status: 400 });
    }
    
    const qrCodeData = {
      business_id: activeBusiness.id,
      name: formData.get('name') as string || `QR Code ${existingQRCodes?.length ? existingQRCodes.length + 1 : 1}`,
      location: formData.get('location') as string || '',
      is_active: formData.get('is_active') === 'true',
      custom_settings: JSON.stringify({
        background_color: formData.get('background_color') || '#ffffff',
        foreground_color: formData.get('foreground_color') || '#000000',
        text: formData.get('text') || 'Scannez pour donner votre avis',
        include_logo: formData.get('include_logo') === 'true'
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data: qrCode, error } = await supabase
      .from('qr_codes')
      .insert(qrCodeData)
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({ qrCode })
  } catch (error) {
    if (error instanceof Error && error.message.includes('User not found')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
