import { createSupabaseServer } from '@/lib/supabase-server'
import { requireUserServer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Si session temporaire, retourner des données factices
    if (auth.isTempSession) {
      return NextResponse.json({
        qrCodes: [],
        total: 0,
        active: 0,
        inactive: 0
      });
    }

    // Authentification Supabase normale
    const user = await requireUserServer()
    const supabase = await createSupabaseServer()
    
    // Get business for the user
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_user_id', user.id)
      .single()
    
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }
    
    // Get QR codes for the business
    const { data: qrCodes, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('business_id', business.id)
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
    
    // Get business for the user
    const { data: business } = await supabase
      .from('businesses')
      .select('id, name, slug')
      .eq('owner_user_id', user.id)
      .single()
    
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }
    
    // Check QR code limit based on user's plan
    const { data: existingQRCodes } = await supabase
      .from('qr_codes')
      .select('id')
      .eq('business_id', business.id)
    
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
    
    // Determine max QR codes based on plan
    let maxQRCodes: number | null = 5; // Default starter limit
    if (subscription?.plan?.slug === 'pro') {
      maxQRCodes = 50;
    } else if (subscription?.plan?.slug === 'agency') {
      maxQRCodes = null; // Unlimited
    }
    
    // Check limit (only if not unlimited)
    if (maxQRCodes !== null && existingQRCodes && existingQRCodes.length >= maxQRCodes) {
      return NextResponse.json({ 
        error: 'QR code limit reached', 
        details: `Maximum ${maxQRCodes} QR codes allowed for ${subscription?.plan?.slug || 'starter'} plan`
      }, { status: 400 });
    }
    
    const qrCodeData = {
      business_id: business.id,
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
