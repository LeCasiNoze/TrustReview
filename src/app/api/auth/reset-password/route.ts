import { NextResponse } from "next/server";
import { sendResetPassword } from "@/lib/email";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe
    const supabase = await createSupabaseServer();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (userError || !user) {
      // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
      return NextResponse.json({ 
        success: true, 
        message: "Si cet email existe, un lien de réinitialisation a été envoyé" 
      });
    }

    // Générer un token de réinitialisation
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Sauvegarder le token en base de données
    const { error } = await supabase
      .from('users')
      .update({ 
        reset_token: token,
        reset_expires: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1h
      })
      .eq('email', email);

    if (error) {
      console.error('Error saving reset token:', error);
      return NextResponse.json({ error: "Erreur lors de la sauvegarde du token" }, { status: 500 });
    }

    // Envoyer l'email de réinitialisation
    const emailSent = await sendResetPassword(email, token);

    if (!emailSent) {
      return NextResponse.json({ error: "Erreur lors de l'envoi de l'email" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Si cet email existe, un lien de réinitialisation a été envoyé" 
    });

  } catch (error) {
    console.error('Error in reset-password:', error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { token, email, newPassword } = await req.json();

    if (!token || !email || !newPassword) {
      return NextResponse.json({ error: "Token, email et nouveau mot de passe requis" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    
    // Vérifier le token
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, reset_token, reset_expires')
      .eq('email', email)
      .single();

    if (userError || !user || user.reset_token !== token) {
      return NextResponse.json({ error: "Token invalide" }, { status: 400 });
    }

    // Vérifier l'expiration
    if (new Date() > new Date(user.reset_expires)) {
      return NextResponse.json({ error: "Token expiré" }, { status: 400 });
    }

    // Mettre à jour le mot de passe via Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json({ error: "Erreur lors de la mise à jour du mot de passe" }, { status: 500 });
    }

    // Nettoyer le token
    await supabase
      .from('users')
      .update({ 
        reset_token: null,
        reset_expires: null
      })
      .eq('email', email);

    return NextResponse.json({ 
      success: true, 
      message: "Mot de passe mis à jour avec succès" 
    });

  } catch (error) {
    console.error('Error in reset-password PUT:', error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
