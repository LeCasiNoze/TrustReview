import { NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    if (!email || !message) {
      return NextResponse.json({ error: "Email et message requis" }, { status: 400 });
    }

    // Validation basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    if (message.length < 10) {
      return NextResponse.json({ error: "Le message doit contenir au moins 10 caractères" }, { status: 400 });
    }

    // Envoyer l'email de contact
    const emailSent = await sendContactEmail(email, message, name);

    if (!emailSent) {
      return NextResponse.json({ error: "Erreur lors de l'envoi du message" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Message envoyé avec succès" 
    });

  } catch (error) {
    console.error('Error in contact:', error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
