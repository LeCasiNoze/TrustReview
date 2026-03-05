import { createSupabaseServer } from '@/lib/supabase-server'
import { requireUserServer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const user = await requireUserServer()
    const supabase = await createSupabaseServer()
    
    const formData = await request.formData()
    const googleReviewUrl = formData.get('google_review_url') as string

    // Get existing business
    const { data: business, error: fetchError } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_user_id', user.id)
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

    if (updateError) {
      throw new Error(`Failed to update Google URL: ${updateError.message}`)
    }

    redirect('/app/business')
  } catch (error) {
    if (error instanceof Error && error.message.includes('User not found')) {
      return new Response('Unauthorized', { status: 401 })
    }
    throw error
  }
}
