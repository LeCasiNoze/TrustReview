"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const supabase = createSupabaseBrowser();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Timer pour le cooldown
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  // Fonction pour mapper les erreurs en français
  function mapErrorMessage(error: string): string {
    if (error.toLowerCase().includes('rate limit')) {
      return "Trop de demandes. Attends 1 minute puis réessaie.";
    }
    if (error.toLowerCase().includes('invalid') || error.toLowerCase().includes('credentials')) {
      return "Email invalide.";
    }
    if (error.toLowerCase().includes('network') || error.toLowerCase().includes('timeout')) {
      return "Service email lent. Réessaie dans 1 minute.";
    }
    return error;
  }

  // Fonction pour démarrer le cooldown
  function startCooldown(seconds: number = 60) {
    setCooldownSeconds(seconds);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    // Anti double-submit
    if (loading || cooldownSeconds > 0) {
      return;
    }
    
    setLoading(true);
    setMsg(null);
    setIsError(false);

    const startTime = Date.now();
    
    // URL de base sécurisée
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    const redirectUrl = `${baseUrl}/auth/callback`;

    if (process.env.NODE_ENV !== "production") {
      console.log("🔐 Login attempt started", { email, redirectUrl, startTime });
    }

    // Timeout client de 12 secondes
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("TIMEOUT")), 12000);
    });

    try {
      const result = await Promise.race([
        supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectUrl },
        }),
        timeoutPromise
      ]);

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (process.env.NODE_ENV !== "production") {
        console.log("✅ Login attempt completed", { duration, success: true });
      }

      setLoading(false);
      setSent(true);
      setMsg("Lien de connexion envoyé ! Vérifiez votre boîte mail (et les spams).");
      startCooldown(60); // Cooldown de 60s après succès

    } catch (error: any) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      if (process.env.NODE_ENV !== "production") {
        console.log("❌ Login attempt failed", { duration, error: error.message });
      }

      setLoading(false);

      if (error.message === "TIMEOUT") {
        setMsg("L'envoi du mail prend trop de temps. Réessaie dans 1 minute.");
        setIsError(true);
        startCooldown(60); // Cooldown de 60s après timeout
      } else {
        const mappedError = mapErrorMessage(error.message);
        setMsg(mappedError);
        setIsError(true);
        
        // Cooldown pour rate limiting
        if (error.message.toLowerCase().includes('rate limit')) {
          startCooldown(60);
        }
      }
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "hsl(224 71% 4%)",
        backgroundImage: "radial-gradient(at 40% 20%, hsla(226, 71%, 40%, 0.15) 0px, transparent 50%), radial-gradient(at 80% 80%, hsla(262, 83%, 40%, 0.1) 0px, transparent 50%)",
      }}
    >
      <div className="w-full max-w-sm animate-fadein">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg, hsl(226 71% 55%), hsl(262 83% 58%))" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: "hsl(0 0% 95%)" }}>
            TrustReview
          </h1>
          <p className="text-sm mt-1" style={{ color: "hsl(220 10% 50%)" }}>
            La plateforme d&apos;avis pour les professionnels
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "hsl(224 40% 8%)",
            border: "1px solid hsl(224 30% 14%)",
            boxShadow: "0 24px 48px rgba(0,0,0,0.4), 0 0 0 1px hsl(224 30% 14%)",
          }}
        >
          {!sent ? (
            <>
              <div className="mb-5">
                <h2 className="text-base font-semibold" style={{ color: "hsl(0 0% 95%)" }}>
                  Connexion
                </h2>
                <p className="text-xs mt-1" style={{ color: "hsl(220 10% 50%)" }}>
                  Entrez votre email pour recevoir un lien de connexion sécurisé.
                </p>
              </div>

              <form onSubmit={submit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "hsl(220 10% 65%)" }}>
                    Adresse email
                  </label>
                  <input
                    type="email"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full text-sm rounded-lg px-3 py-2.5 outline-none transition-all duration-150"
                    style={{
                      background: "hsl(224 40% 12%)",
                      border: "1px solid hsl(224 30% 20%)",
                      color: "hsl(0 0% 90%)",
                    }}
                    onFocus={e => {
                      e.target.style.border = "1px solid hsl(226 71% 55%)"
                      e.target.style.boxShadow = "0 0 0 3px hsl(226 71% 55% / 0.15)"
                    }}
                    onBlur={e => {
                      e.target.style.border = "1px solid hsl(224 30% 20%)"
                      e.target.style.boxShadow = "none"
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || cooldownSeconds > 0}
                  className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: loading || cooldownSeconds > 0 
                      ? "hsl(224 30% 20%)" 
                      : "linear-gradient(135deg, hsl(226 71% 55%), hsl(226 71% 50%))",
                    color: "white",
                    boxShadow: loading || cooldownSeconds > 0 
                      ? "none" 
                      : "0 1px 3px rgba(66, 99, 235, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
                  }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      Envoi en cours…
                    </>
                  ) : cooldownSeconds > 0 ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      Renvoyer dans {cooldownSeconds}s
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                      </svg>
                      Envoyer le lien de connexion
                    </>
                  )}
                </button>
              </form>

              {msg && isError && (
                <div
                  className="mt-3 rounded-lg px-3 py-2 text-xs"
                  style={{ background: "hsl(0 70% 50% / 0.12)", border: "1px solid hsl(0 70% 50% / 0.25)", color: "hsl(0 84% 65%)" }}
                >
                  {msg}
                </div>
              )}
            </>
          ) : (
            /* Success state */
            <div className="flex flex-col items-center text-center py-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full mb-4"
                style={{ background: "hsl(142 72% 42% / 0.15)", border: "1px solid hsl(142 72% 42% / 0.3)" }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="hsl(142 72% 50%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 className="text-sm font-semibold mb-1" style={{ color: "hsl(0 0% 95%)" }}>
                Email envoyé !
              </h2>
              <p className="text-xs leading-relaxed" style={{ color: "hsl(220 10% 55%)" }}>
                Un lien de connexion a été envoyé à <span style={{ color: "hsl(226 100% 78%)" }}>{email}</span>.<br/>
                Vérifiez aussi vos spams.
              </p>
              <button
                onClick={() => { 
                  setSent(false); 
                  setMsg(null); 
                  setIsError(false);
                }}
                disabled={cooldownSeconds > 0}
                className="mt-4 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ color: cooldownSeconds > 0 ? "hsl(220 10% 25%)" : "hsl(220 10% 50%)" }}
              >
                {cooldownSeconds > 0 ? `Utiliser une autre adresse (${cooldownSeconds}s)` : "Utiliser une autre adresse"}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: "hsl(220 10% 35%)" }}>
          Connexion sécurisée par lien magique · Aucun mot de passe
        </p>
      </div>
    </main>
  );
}
