import { createSupabaseServer } from './supabase-server'

export async function getBusinessBySlug(slug: string) {
  const supabase = await createSupabaseServer()
  
  const { data, error } = await supabase
    .from('businesses')
    .select('id, name, google_review_url, threshold_positive, is_active')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  
  if (error) {
    throw new Error(`Business not found: ${error.message}`)
  }
  
  return data
}
