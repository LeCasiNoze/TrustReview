import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token = searchParams.get('token')
  const type = searchParams.get('type')
  const email = searchParams.get('email')
  const codeVerified = searchParams.get('code_verified')
  const next = searchParams.get('next') ?? '/app'

  console.log("🔐 [CALLBACK] Received request:", {
    hasCode: !!code,
    hasToken: !!token,
    type,
    hasEmail: !!email,
    codeVerified,
    next,
    searchParams: Object.fromEntries(searchParams.entries())
  });

  // Cas spécial : login par code vérifié (uniquement si code_verified = true ET email présent)
  // Mais ignorer si c'est un magic link Supabase normal (qui a aussi email et code)
  if (codeVerified === 'true' && email && !code && !token) {
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

  // Magic link Supabase avec token (format réel reçu)
  if (token && type === 'magiclink') {
    console.log("🔐 [CALLBACK] Processing magic link with token:", token.substring(0, 20) + "...");
    
    const supabase = await createSupabaseServer()
    
    // Utiliser verifyOtp pour les magic links avec token
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'magiclink'
    })
    
    if (error) {
      console.error("❌ [CALLBACK] Verify OTP failed:", {
        error: error.message,
        code: error.code
      });
      redirect('/auth/error')
    }
    
    console.log("✅ [CALLBACK] Verify OTP successful, checking user...");
    
    // Récupérer l'utilisateur pour déterminer s'il est nouveau
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.error("❌ [CALLBACK] No user found after verify");
      redirect('/auth/error')
    }
    
    console.log("👤 [CALLBACK] User authenticated:", { id: user.id, email: user.email });
    
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
    
    console.log("💳 [CALLBACK] Access check:", { hasValidAccess, subscription: subscription?.status });
    
    // Rediriger vers billing seulement si pas d'accès valide
    if (!hasValidAccess) {
      console.log("🔀 [CALLBACK] Redirecting to billing (no access)");
      redirect('/app/billing')
    }
    
    console.log("🔀 [CALLBACK] Redirecting to app:", next);
    redirect(next)
  }

  // Magic link Supabase avec code (ancien format, compatibilité)
  if (code) {
    const supabase = await createSupabaseServer()
    
    console.log("🔐 [CALLBACK] Processing magic link with code:", code.substring(0, 20) + "...");
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error("❌ [CALLBACK] Exchange code failed:", {
        error: error.message,
        code: error.code
      });
      redirect('/auth/error')
    }
    
    console.log("✅ [CALLBACK] Exchange code successful, checking user...");
    
    // Récupérer l'utilisateur pour déterminer s'il est nouveau
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.error("❌ [CALLBACK] No user found after exchange");
      redirect('/auth/error')
    }
    
    console.log("👤 [CALLBACK] User authenticated:", { id: user.id, email: user.email });
    
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
    
    console.log("💳 [CALLBACK] Access check:", { hasValidAccess, subscription: subscription?.status });
    
    // Rediriger vers billing seulement si pas d'accès valide
    if (!hasValidAccess) {
      console.log("🔀 [CALLBACK] Redirecting to billing (no access)");
      redirect('/app/billing')
    }
    
    console.log("🔀 [CALLBACK] Redirecting to app:", next);
    redirect(next)
  }

  // redirect the user to an error page
  redirect('/auth/error')
}
