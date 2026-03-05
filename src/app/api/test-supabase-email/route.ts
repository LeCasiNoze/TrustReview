import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    
    console.log("🧪 Testing Supabase email to:", email);
    console.log("📧 Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("🔧 App URL:", process.env.NEXT_PUBLIC_APP_URL);
    
    // Test direct avec Supabase
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { 
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      }
    });

    if (error) {
      console.error("❌ Supabase error:", error);
      return NextResponse.json({ 
        error: error.message,
        details: error
      }, { status: 500 });
    }

    console.log("✅ Supabase response:", data);

    return NextResponse.json({ 
      success: true,
      message: "Email de test envoyé via Supabase",
      data
    });

  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json({ 
      error: "Erreur lors du test email",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
