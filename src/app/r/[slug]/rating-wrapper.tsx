"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
  businessId: string;
  slug: string;
  name: string;
  googleReviewUrl: string;
  thresholdPositive: number;
};

export default function RatingWrapper({
  businessId,
  slug,
  name,
  googleReviewUrl,
  thresholdPositive,
}: Props) {
  const router = useRouter();
  const [rating, setRating] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Increment scan count when page loads
  useEffect(() => {
    const incrementScan = async () => {
      try {
        await fetch("/api/qr-scan", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            businessId,
            source: "qr",
          }),
        });
      } catch (error) {
        console.error("Failed to increment scan:", error);
        // Ne pas bloquer l'expérience utilisateur si l'incrément échoue
      }
    };

    incrementScan();
  }, [businessId]);

  const isPositive = useMemo(() => {
    if (rating == null) return false;
    return rating >= (thresholdPositive ?? 4);
  }, [rating, thresholdPositive]);

  async function submitRating(value: number) {
    setRating(value);
    setLoading(true);

    try {
      const res = await fetch("/api/rating", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          businessId,
          stars: value,
          source: "qr",
        }),
      });

      const json = await res.json().catch(() => null);

      if (value >= (thresholdPositive ?? 4)) {
        // Redirection vers la page thanks au lieu de go direct
        router.push(`/r/${slug}/thanks?stars=${value}`);
        return;
      }

      // négatif -> feedback privé
      router.push(`/r/${slug}/feedback?session=${json?.sessionId ?? ""}&stars=${value}`);
    } finally {
      setLoading(false);
    }
  }

  const labels: Record<number, string> = {
    5: "Excellent !  Vous avez adoré.",
    4: "Super ! Vous avez apprécié.",
    3: "Correct. Merci pour le retour.",
    2: "Désolés. On va s'améliorer.",
    1: "Vraiment désolés. Dites-nous tout.",
  };

  return (
    <div className="bg-public flex items-center justify-center p-5">
      <div className="w-full max-w-sm animate-fadein-scale">

        {/* Logo pill */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
            style={{ background:"rgba(255,255,255,0.7)", border:"1px solid rgba(0,0,0,0.07)", color:"hsl(220 9% 46%)", backdropFilter:"blur(8px)" }}>
            <div className="h-4 w-4 rounded flex items-center justify-center" style={{ background:"linear-gradient(135deg, hsl(226 71% 55%), hsl(262 83% 58%))" }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            TrustReview
          </div>
        </div>

        {/* Main card */}
        <div className="rounded-2xl bg-white p-7 text-center"
          style={{ boxShadow:"0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)", border:"1px solid hsl(30 20% 90%)" }}>

          {/* Business badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-5 text-xs font-medium"
            style={{ background:"hsl(226 100% 96%)", color:"hsl(226 71% 45%)", border:"1px solid hsl(226 100% 89%)" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
            {name}
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-1.5" style={{ letterSpacing:"-0.02em" }}>
            Comment s&apos;est passée votre visite ?
          </h1>
          <p className="text-sm text-gray-500 mb-8">Votre avis aide toute l&apos;équipe.</p>

          {/* Stars */}
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => {
              const filled = star <= (hover ?? rating ?? 0);
              return (
                <button
                  key={star}
                  onClick={() => submitRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(null)}
                  disabled={loading}
                  aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
                  className="transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 focus-ring"
                  style={{
                    fontSize: "2.6rem",
                    lineHeight: 1,
                    color: filled ? "hsl(38 92% 52%)" : "hsl(220 13% 88%)",
                    transform: filled ? "scale(1.15)" : "scale(1)",
                    filter: filled ? "drop-shadow(0 2px 6px hsla(38,92%,52%,0.4))" : "none",
                  }}
                >★</button>
              );
            })}
          </div>

          {/* Feedback label */}
          <div style={{ minHeight:"1.5rem" }} className="mb-4">
            {rating !== null && (
              <p className="text-sm font-medium animate-fadein" style={{ color:"hsl(226 71% 50%)" }}>
                {labels[rating]}
              </p>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center gap-2 text-sm" style={{ color:"hsl(226 71% 55%)" }}>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Envoi en cours…
            </div>
          )}
        </div>

        <p className="text-center text-xs mt-5" style={{ color:"hsl(220 9% 62%)" }}>
          Votre retour nous aide à offrir une meilleure expérience
        </p>
      </div>
    </div>
  );
}