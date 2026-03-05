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
      // Récupérer l'utilisateur pour déterminer s'il est nouveau
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Vérifier si l'utilisateur a un abonnement
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', user.id)
          .single()
        
        // Si aucun abonnement ou statut 'none', rediriger vers billing pour onboarding
        if (!subscription || subscription.status === 'none') {
          redirect('/app/billing')
        }
      }
      
      redirect(next)
    }
  }

  // redirect the user to an error page
  redirect('/auth/error')
}
