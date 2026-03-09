import { NextResponse } from 'next/server'
import { getRequestIdentity, getSupabaseForIdentity } from '@/lib/request-identity'
import { redirect } from 'next/navigation'

export async function POST(request: Request) {
  try {
    const identity = await getRequestIdentity();
    
    if (!identity.isAuthenticated || !identity.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseForIdentity(identity);
    
    const formData = await request.formData()
    const googleReviewUrl = formData.get('google_review_url') as string

    // Get existing business
    const { data: business, error: fetchError } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_user_id', identity.userId)
      .single()

    if (fetchError && fetchError.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Create a business first' },
        { status: 400 }
      )
    }

    if (fetchError || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Update Google review URL
    const { error: updateError } = await supabase
      .from('businesses')
      .update({ 
        google_review_url: googleReviewUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', business.id)
      .eq('owner_user_id', identity.userId)

    if (updateError) {
      throw new Error(`Failed to update Google URL: ${updateError.message}`)
    }

    redirect('/app/business')
  } catch (error) {
    if (error instanceof Error && error.message.includes('User not found')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    throw error
  }
}
