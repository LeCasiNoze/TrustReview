import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    // SÉCURITÉ: Uniquement en développement ou pour l'admin
    const isDev = process.env.NODE_ENV === 'development';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@trustreview.test';
    
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier si c'est l'admin ou si on est en dev
    if (!isDev && user.email !== adminEmail) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { trialEnd } = await req.json();

    // Récupérer l'abonnement existant
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!subscription) {
      return NextResponse.json({ error: "Aucun abonnement trouvé" }, { status: 404 });
    }

    // Mettre à jour la date de fin de trial
    const { data } = await supabase
      .from('subscriptions')
      .update({
        trial_end: trialEnd,
        status: new Date(trialEnd) > new Date() ? 'trialing' : 'active',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single();

    const trialDaysLeft = trialEnd ? Math.max(0, Math.ceil((new Date(trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

    console.log(`🧪 [DEV] Trial mis à jour: ${user.email} -> ${trialDaysLeft} jours restants`);

    return NextResponse.json({ 
      success: true,
      subscription: data,
      trialDaysLeft,
      message: `Trial mis à jour: ${trialDaysLeft} jours restants`
    });

  } catch (error) {
    console.error('Error setting trial:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to set trial"
    }, { status: 500 });
  }
}
