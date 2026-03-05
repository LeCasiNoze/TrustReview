import { NextResponse } from "next/server";
import { sendVerifyEmail } from "@/lib/email";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    // Générer un token de vérification
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Sauvegarder le token en base de données
    const supabase = await createSupabaseServer();
    const { error } = await supabase
      .from('users')
      .update({ 
        verification_token: token,
        verification_expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
      })
      .eq('email', email);

    if (error) {
      console.error('Error saving verification token:', error);
      return NextResponse.json({ error: "Erreur lors de la sauvegarde du token" }, { status: 500 });
    }

    // Envoyer l'email de vérification
    const emailSent = await sendVerifyEmail(email, token);

    if (!emailSent) {
      return NextResponse.json({ error: "Erreur lors de l'envoi de l'email" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Email de vérification envoyé" 
    });

  } catch (error) {
    console.error('Error in send-verify:', error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
