import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const email = searchParams.get('email')
  const codeVerified = searchParams.get('code_verified')
  const next = searchParams.get('next') ?? '/app'

  // Cas spécial : login par code vérifié (uniquement si code_verified = true ET email présent)
  // Mais ignorer si c'est un magic link Supabase normal (qui a aussi email et code)
  if (codeVerified === 'true' && email && !code) {
    console.log("🔐 Processing verified code login for:", email);
    
    // Créer une session Supabase pour cet email
    const supabase = await createSupabaseServer()
    
    // Générer un magic link Supabase pour cet email
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      }
    })

    if (error) {
      console.error("❌ Error creating Supabase session:", error)
      redirect('/auth/error')
    }

    // Rediriger vers login avec un message spécial
    const loginUrl = `${origin}/login?message=code-login-success&email=${encodeURIComponent(email)}`
    redirect(loginUrl)
  }

  // Magic link Supabase normal (prioritaire)
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
