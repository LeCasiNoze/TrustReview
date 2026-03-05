"use client";

import { useRouter } from "next/navigation";

type Props = {
  businessId: string;
  slug: string;
  name: string;
  googleReviewUrl: string;
  stars: number;
};

export default function ThanksWrapper({ name, googleReviewUrl, stars }: Props) {
  const router = useRouter();

  const handleGoogleReview = () => {
    if (googleReviewUrl) {
      window.location.href = googleReviewUrl;
    }
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

        {/* Card */}
        <div className="rounded-2xl bg-white p-7 text-center"
          style={{ boxShadow:"0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)", border:"1px solid hsl(30 20% 90%)" }}>

          {/* Check icon */}
          <div className="flex justify-center mb-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background:"hsl(142 72% 42% / 0.1)", border:"2px solid hsl(142 72% 42% / 0.25)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(142 72% 42%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-1" style={{ letterSpacing:"-0.02em" }}>
            Merci pour votre avis !
          </h1>

          {/* Stars */}
          <div className="flex justify-center gap-1 my-4">
            {[...Array(5)].map((_, i) => (
              <span key={i} style={{ fontSize:"1.4rem", color: i < stars ? "hsl(38 92% 52%)" : "hsl(220 13% 88%)" }}>★</span>
            ))}
          </div>

          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Votre retour nous fait vraiment plaisir.
            <br/>
            Si vous avez <strong>10 secondes</strong>, vous pouvez encore plus nous aider en le partageant sur Google.
          </p>

          <button
            onClick={handleGoogleReview}
            className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            style={{ background:"linear-gradient(135deg, hsl(226 71% 58%), hsl(226 71% 52%))", boxShadow:"0 2px 8px hsla(226,71%,55%,0.45)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Laisser un avis sur Google
          </button>
        </div>

        <p className="text-center text-xs mt-5" style={{ color:"hsl(220 9% 62%)" }}>
          Merci beaucoup pour votre soutien 🙏
        </p>
      </div>
    </div>
  );
}
