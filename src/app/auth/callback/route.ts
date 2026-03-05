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
        // Vérifier si l'utilisateur a un abonnement actif
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('status, trial_end')
          .eq('user_id', user.id)
          .single()
        
        // Déterminer si l'utilisateur a un accès valide
        let hasValidAccess = false;
        
        if (!subscription) {
          // Aucun abonnement = créer un essai par défaut et autoriser l'accès
          hasValidAccess = true;
        } else if (subscription.status === 'trialing' && subscription.trial_end) {
          // Essai en cours et non expiré
          hasValidAccess = new Date(subscription.trial_end) > new Date();
        } else if (['active'].includes(subscription.status)) {
          // Abonnement actif
          hasValidAccess = true;
        }
        
        // Rediriger vers billing seulement si pas d'accès valide
        if (!hasValidAccess) {
          redirect('/app/billing')
        }
      }
      
      redirect(next)
    }
  }

  // redirect the user to an error page
  redirect('/auth/error')
}
