import Link from "next/link"

export const metadata = {
  title: "TrustReview — Collectez plus d'avis Google avec un QR code intelligent",
  description: "Vos clients notent leur expérience en 10 secondes. Les avis positifs vont sur Google. Les retours négatifs restent privés.",
}

export default function Home() {
  return (
    <div className="bg-marketing">

      {/* ── NAV ─────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: "rgba(10,12,30,0.75)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="max-w-6xl mx-auto px-5 flex justify-between items-center h-15" style={{ height: "60px" }}>
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: "linear-gradient(135deg, hsl(226 71% 55%), hsl(262 83% 58%))" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">TrustReview</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {[["Fonctionnalités", "/features"], ["Tarifs", "/pricing"], ["Contact", "/contact"]].map(([label, href]) => (
              <Link key={href} href={href}
                className="text-sm font-medium transition-colors hover:text-white"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >{label}</Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium transition-colors hidden sm:block" style={{ color: "rgba(255,255,255,0.55)" }}>
              Se connecter
            </Link>
            <Link href="/login" className="btn-primary-marketing" style={{ padding: "0.45rem 1.1rem", fontSize: "0.85rem" }}>
              Commencer
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────── */}
      <section className="relative pt-28 pb-32 px-5 text-center overflow-hidden">
        {/* Glow orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div style={{ position:"absolute", top:"10%", left:"50%", transform:"translateX(-50%)", width:"600px", height:"300px", background:"radial-gradient(ellipse, hsla(226,90%,60%,0.15) 0%, transparent 70%)", filter:"blur(40px)" }} />
          <div style={{ position:"absolute", top:"5%", right:"10%", width:"300px", height:"200px", background:"radial-gradient(ellipse, hsla(262,83%,65%,0.1) 0%, transparent 70%)", filter:"blur(30px)" }} />
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full mb-8 px-4 py-1.5 text-xs font-medium"
            style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.7)" }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"hsl(142 72% 50%)", display:"inline-block", boxShadow:"0 0 6px hsl(142 72% 50%)" }} />
            QR codes intelligents pour professionnels
          </div>

          <h1 className="heading-xl text-white mb-6">
            Collectez plus d&apos;avis Google
            <br />
            <span className="text-gradient">sans effort.</span>
          </h1>

          <p className="text-lg leading-relaxed mx-auto mb-10 max-w-2xl" style={{ color: "rgba(255,255,255,0.6)" }}>
            Vos clients notent leur expérience en <strong style={{ color:"rgba(255,255,255,0.85)" }}>10 secondes</strong>. Les avis positifs vont sur Google. Les retours négatifs restent privés.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Link href="/login" className="btn-primary-marketing">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l14 9-14 9V3z"/></svg>
              Créer mon QR code gratuitement
            </Link>
            <Link href="/pricing" className="btn-outline-marketing">
              Voir les tarifs
            </Link>
          </div>

          {/* Social proof pills */}
          <div className="flex flex-wrap justify-center gap-3">
            {["Sans carte bancaire", "Installé en 5 min", "Support inclus"].map(t => (
              <span key={t} className="text-xs font-medium px-3 py-1 rounded-full"
                style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.5)" }}>
                ✓ {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ───────────────────────── */}
      <section className="py-24 px-5 marketing-section-tinted">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color:"hsl(226 100% 75%)" }}>Fonctionnement</p>
            <h2 className="heading-lg text-white">Aussi simple que de scanner un code</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step:"01", icon:"▣", title:"Le client scanne", desc:"En quelques secondes, il accède à votre page de notation personnalisée via le QR code." },
              { step:"02", icon:"★", title:"Il choisit une note", desc:"Interface ultra-simple : notation de 1 à 5 étoiles, un seul clic, sans compte." },
              { step:"03", icon:"↗", title:"Routage intelligent", desc:"Notes 4–5★ → Google. Notes 1–3★ → feedback privé qui vous revient directement." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="card-glass p-6 rounded-2xl">
                <div className="text-xs font-bold mb-4 tracking-widest" style={{ color:"hsl(226 100% 75%)" }}>{step}</div>
                <h3 className="heading-md text-white mb-2">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color:"rgba(255,255,255,0.55)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BÉNÉFICES ───────────────────────────────── */}
      <section className="py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color:"hsl(226 100% 75%)" }}>Pourquoi TrustReview</p>
            <h2 className="heading-lg text-white">Votre réputation en ligne, maîtrisée</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon:"↑", color:"hsl(142 72% 50%)", title:"Plus d'avis 5★", desc:"Boostez votre note Google avec des avis positifs authentiques." },
              { icon:"🔒", color:"hsl(226 71% 65%)", title:"Protégez votre réputation", desc:"Les insatisfactions restent privées, loin de Google." },
              { icon:"💡", color:"hsl(38 92% 60%)", title:"Feedback actionnable", desc:"Comprenez précisément ce qui doit s'améliorer." },
              { icon:"⊞",  color:"hsl(262 83% 70%)", title:"Multi-emplacements", desc:"Un QR code par table, entrée, caisse... Chacun tracké." },
            ].map(({ icon, color, title, desc }) => (
              <div key={title} className="card-glass p-5 rounded-xl hover-lift">
                <div className="text-xl mb-3" style={{ color }}>{icon}</div>
                <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color:"rgba(255,255,255,0.5)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ─────────────────────────────── */}
      <section className="py-24 px-5 marketing-section-tinted">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color:"hsl(226 100% 75%)" }}>Témoignages</p>
            <h2 className="heading-lg text-white">Pensé pour les commerces de proximité</h2>
            <p className="mt-3 text-sm" style={{ color:"rgba(255,255,255,0.45)" }}>Restaurants · Artisans · Salons · Hôtels</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { quote: "Simple à mettre en place. Nos clients adorent.", author: "Restaurant, Lyon" },
              { quote: "Nos avis Google ont augmenté de 40% en un mois.", author: "Salon de coiffure, Paris" },
              { quote: "Le feedback privé nous aide vraiment à nous améliorer.", author: "Hôtel Boutique, Bordeaux" },
            ].map(({ quote, author }) => (
              <div key={author} className="card-glass p-6 rounded-2xl">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => <span key={i} style={{ color:"hsl(38 92% 60%)", fontSize:"13px" }}>★</span>)}
                </div>
                <p className="text-sm italic leading-relaxed mb-4" style={{ color:"rgba(255,255,255,0.72)" }}>&ldquo;{quote}&rdquo;</p>
                <p className="text-xs font-medium" style={{ color:"rgba(255,255,255,0.35)" }}>— {author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────── */}
      <section className="py-28 px-5 text-center relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"500px", height:"300px", background:"radial-gradient(ellipse, hsla(226,90%,60%,0.12) 0%, transparent 70%)", filter:"blur(60px)" }} />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <h2 className="heading-lg text-white mb-4">Prêt à booster votre réputation ?</h2>
          <p className="text-sm mb-8" style={{ color:"rgba(255,255,255,0.5)" }}>Installation en 5 minutes · Sans engagement</p>
          <Link href="/login" className="btn-primary-marketing" style={{ fontSize:"1rem", padding:"0.875rem 2rem" }}>
            Commencer gratuitement →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────── */}
      <footer style={{ background:"hsl(224 71% 2%)", borderTop:"1px solid rgba(255,255,255,0.07)" }} className="py-12 px-5">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background:"linear-gradient(135deg, hsl(226 71% 55%), hsl(262 83% 58%))" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="white"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <span className="text-sm font-semibold text-white">TrustReview</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color:"rgba(255,255,255,0.35)" }}>QR codes intelligents pour mieux gérer vos avis clients.</p>
          </div>
          {[
            { title:"Produit",    links:[["Fonctionnalités","/features"],["Tarifs","/pricing"]] },
            { title:"Entreprise", links:[["Contact","/contact"],["Mentions légales","/legal"]] },
            { title:"Compte",     links:[["Se connecter","/login"],["Commencer","/login"]] },
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color:"rgba(255,255,255,0.35)" }}>{title}</h4>
              <ul className="space-y-2">
                {links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-xs transition-colors" style={{ color:"rgba(255,255,255,0.45)" }}>{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-5xl mx-auto mt-10 pt-6 text-center text-xs" style={{ borderTop:"1px solid rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.25)" }}>
          &copy; 2025 TrustReview. Tous droits réservés.
        </div>
      </footer>

    </div>
  )
}
