import { createSupabaseServer } from '@/lib/supabase-server'
import { getRequestIdentity, getSupabaseForIdentity } from '@/lib/request-identity'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

export async function POST(request: Request) {
  try {
    const identity = await getRequestIdentity()
    
    if (!identity.isAuthenticated || !identity.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const supabase = await getSupabaseForIdentity(identity)
    
    const formData = await request.formData()
    
    const businessData = {
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      google_review_url: formData.get('google_review_url') as string,
      threshold_positive: parseInt(formData.get('threshold_positive') as string) || 4,
      notification_email: formData.get('notification_email') as string,
      logo_url: formData.get('logo_url') as string,
      notif_new_review: formData.get('notif_new_review') === 'true',
      notif_low_rating: formData.get('notif_low_rating') === 'true',
      owner_user_id: identity.userId,
      updated_at: new Date().toISOString()
    }

    // Check if business already exists
    const { data: existingBusiness } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_user_id', identity.userId)
      .single()

    let result
    if (existingBusiness) {
      // Update existing business
      result = await supabase
        .from('businesses')
        .update(businessData)
        .eq('id', existingBusiness.id)
        .eq('owner_user_id', identity.userId)
    } else {
      // Create new business
      result = await supabase
        .from('businesses')
        .insert({
          ...businessData,
          created_at: new Date().toISOString(),
          is_active: true
        })
    }

    if (result.error) {
      throw new Error(`Failed to save business: ${result.error.message}`)
    }

    redirect('/app/business')
  } catch (error) {
    if (error instanceof Error && error.message.includes('User not found')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    throw error
  }
}
