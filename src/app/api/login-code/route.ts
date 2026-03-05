import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

// Stockage temporaire en mémoire (en production, utiliser Redis ou DB)
const loginCodes = new Map<string, { code: string; email: string; expires: number }>();

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    // Générer un code à 6 chiffres
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Stocker le code (expire après 10 minutes)
    loginCodes.set(code, {
      code,
      email,
      expires: Date.now() + 10 * 60 * 1000
    });

    console.log("🔐 Login code generated:", { email, code, expires: new Date(Date.now() + 10 * 60 * 1000) });

    return NextResponse.json({
      success: true,
      message: "Code de connexion généré",
      code, // En production, ne pas renvoyer le code, l'envoyer par email
      debug: true // Flag pour indiquer que c'est le mode debug
    });

  } catch (error) {
    console.error("Login code error:", error);
    return NextResponse.json({ 
      error: "Erreur lors de la génération du code",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { email, code } = await req.json();
    
    console.log("🔍 Code verification attempt:", { email, code });
    console.log("📋 Stored codes:", Array.from(loginCodes.entries()));
    
    if (!email || !code) {
      return NextResponse.json({ error: "Email et code requis" }, { status: 400 });
    }

    const storedData = loginCodes.get(code);
    
    console.log("🔍 Found stored data:", storedData);
    
    if (!storedData) {
      console.log("❌ Code not found in storage");
      return NextResponse.json({ error: "Code invalide - non trouvé" }, { status: 400 });
    }

    if (storedData.email !== email) {
      console.log("❌ Email mismatch:", { stored: storedData.email, provided: email });
      return NextResponse.json({ error: "Code ne correspond pas à cet email" }, { status: 400 });
    }

    if (Date.now() > storedData.expires) {
      console.log("❌ Code expired:", { now: Date.now(), expires: storedData.expires });
      loginCodes.delete(code);
      return NextResponse.json({ error: "Code expiré" }, { status: 400 });
    }

    console.log("✅ Code verification successful, creating session");

    // Créer une session simple sans Supabase
    loginCodes.delete(code);

    // Stocker la session dans un cookie
    const response = NextResponse.json({
      success: true,
      message: "Connexion réussie",
      redirectTo: "/app/temp-welcome"
    });

    // Créer un cookie de session simple
    response.cookies.set('temp-session', JSON.stringify({
      email,
      verified: true,
      expires: Date.now() + 24 * 60 * 60 * 1000 // 24h
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24h en secondes
    });

    return response;

  } catch (error) {
    console.error("Login code verification error:", error);
    return NextResponse.json({ 
      error: "Erreur lors de la vérification",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
