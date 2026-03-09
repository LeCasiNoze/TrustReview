import { NextRequest, NextResponse } from 'next/server';
import { getRequestIdentity, getSupabaseForIdentity } from '@/lib/request-identity'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const identity = await getRequestIdentity();

    if (!identity.isAuthenticated || !identity.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (identity.isTempSession) {
      return NextResponse.json({ error: 'Action not available for temporary sessions' }, { status: 403 });
    }

    const supabase = await getSupabaseForIdentity(identity);
    
    // Get the QR code to verify ownership
    const { data: qrCode, error: fetchError } = await supabase
      .from('qr_codes')
      .select('business_id')
      .eq('id', id)
      .single();
    
    if (fetchError || !qrCode) {
      return NextResponse.json({ error: 'QR code not found' }, { status: 404 });
    }
    
    // Verify user owns the business
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', qrCode.business_id)
      .eq('owner_user_id', identity.userId)
      .single();
    
    if (!business) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Prepare update data
    const updateData: any = {
      location: body.location,
      is_active: body.is_active,
      custom_settings: JSON.stringify({
        background_color: body.background_color,
        foreground_color: body.foreground_color,
        text: body.text,
        include_logo: body.include_logo
      })
    };
    
    // Update QR code
    const { data: updatedQR, error: updateError } = await supabase
      .from('qr_codes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    return NextResponse.json(updatedQR);
  } catch (error) {
    console.error('QR code update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const identity = await getRequestIdentity();

    if (!identity.isAuthenticated || !identity.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (identity.isTempSession) {
      return NextResponse.json({ error: 'Action not available for temporary sessions' }, { status: 403 });
    }

    const supabase = await getSupabaseForIdentity(identity);
    
    // Get the QR code with business to verify ownership
    const { data: qrCode, error: fetchError } = await supabase
      .from('qr_codes')
      .select('business_id')
      .eq('id', id)
      .single();
    
    if (fetchError || !qrCode) {
      return NextResponse.json({ error: 'QR code not found' }, { status: 404 });
    }
    
    // Verify user owns the business
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', qrCode.business_id)
      .eq('owner_user_id', identity.userId)
      .single();
    
    if (!business) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Delete QR code
    const { error: deleteError } = await supabase
      .from('qr_codes')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('QR code delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
