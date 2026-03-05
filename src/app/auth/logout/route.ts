import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

// Support GET (navigation) et POST (fetch)
export async function GET(request: Request) {
  return handleLogout()
}

export async function POST(request: Request) {
  return handleLogout()
}

async function handleLogout() {
  try {
    const supabase = await createSupabaseServer()
    await supabase.auth.signOut()
  } catch (error) {
    console.error('Logout error:', error)
  }
  
  // Rediriger vers login au lieu de home
  redirect('/login')
}
