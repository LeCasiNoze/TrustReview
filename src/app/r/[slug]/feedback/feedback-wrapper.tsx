"use client";

import { useState } from "react";

type Props = {
  businessId: string;
  slug: string;
  name: string;
  sessionId: string;
  stars: number;
};

export default function FeedbackWrapper({ businessId, name, sessionId, stars }: Props) {
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          businessId,
          sessionId: sessionId || null,
          stars: stars || null,
          message,
        }),
      });
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  const LogoPill = () => (
    <div className="flex justify-center mb-6">
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
        style={{ background:"rgba(255,255,255,0.7)", border:"1px solid rgba(0,0,0,0.07)", color:"hsl(220 9% 46%)", backdropFilter:"blur(8px)" }}>
        <div className="h-4 w-4 rounded flex items-center justify-center" style={{ background:"linear-gradient(135deg, hsl(226 71% 55%), hsl(262 83% 58%))" }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
        TrustReview
      </div>
    </div>
  );

  if (done) {
    return (
      <div className="bg-public flex items-center justify-center p-5">
        <div className="w-full max-w-sm animate-fadein-scale">
          <LogoPill />
          <div className="rounded-2xl bg-white p-8 text-center"
            style={{ boxShadow:"0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)", border:"1px solid hsl(30 20% 90%)" }}>
            <div className="flex justify-center mb-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background:"hsl(142 72% 42% / 0.1)", border:"2px solid hsl(142 72% 42% / 0.25)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(142 72% 42%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2" style={{ letterSpacing:"-0.02em" }}>
              Merci pour votre retour
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed mb-1">
              Votre message a bien été envoyé à l&apos;équipe de <strong>{name}</strong>.
            </p>
            <p className="text-xs mt-2" style={{ color:"hsl(220 9% 60%)" }}>
              Votre retour reste privé et nous aidera à nous améliorer.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-public flex items-center justify-center p-5">
      <div className="w-full max-w-sm animate-fadein-scale">
        <LogoPill />

        <div className="rounded-2xl bg-white p-7"
          style={{ boxShadow:"0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)", border:"1px solid hsl(30 20% 90%)" }}>

          {/* Business + stars */}
          <div className="flex items-center justify-between mb-5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background:"hsl(38 100% 94%)", color:"hsl(38 92% 32%)", border:"1px solid hsl(38 100% 85%)" }}>
              {name}
            </div>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <span key={i} style={{ fontSize:"1rem", color: i < stars ? "hsl(38 92% 52%)" : "hsl(220 13% 88%)" }}>★</span>
              ))}
            </div>
          </div>

          <h1 className="text-lg font-bold text-gray-900 mb-1" style={{ letterSpacing:"-0.02em" }}>
            Un souci avec votre visite ?
          </h1>
          <p className="text-xs text-gray-500 mb-5">Votre retour reste 100% privé.</p>

          {/* Textarea */}
          <textarea
            className="w-full rounded-xl border text-sm p-3.5 resize-none transition-all duration-150 outline-none"
            style={{
              minHeight:"120px",
              borderColor:"hsl(220 13% 88%)",
              background:"hsl(220 20% 99%)",
              color:"hsl(224 71% 4%)",
            }}
            placeholder="Décrivez ce qui s'est passé et comment nous pouvons nous améliorer…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onFocus={e => { e.target.style.borderColor="hsl(226 71% 55%)"; e.target.style.boxShadow="0 0 0 3px hsl(226 71% 55% / 0.12)"; }}
            onBlur={e => { e.target.style.borderColor="hsl(220 13% 88%)"; e.target.style.boxShadow="none"; }}
          />

          <button
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            onClick={submit}
            disabled={loading || message.trim().length < 3}
            style={{ background:"hsl(220 9% 12%)", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Envoi en cours…
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                Envoyer votre retour
              </>
            )}
          </button>
        </div>

        <p className="text-center text-xs mt-5" style={{ color:"hsl(220 9% 62%)" }}>
          Votre retour est confidentiel et ne sera pas partagé publiquement
        </p>
      </div>
    </div>
  );
}
