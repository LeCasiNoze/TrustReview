import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/app'

  if (code) {
    const supabase = await createSupabaseServer()
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      redirect(next)
    }
  }

  // redirect the user to an error page
  redirect('/auth/error')
}
