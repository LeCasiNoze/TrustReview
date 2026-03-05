"use client"

import { usePathname } from "next/navigation"
import BusinessSwitcher from "@/components/business/business-switcher";
import SubscriptionBanner from "@/components/subscription/subscription-banner";

interface TopbarProps {
  userEmail?: string
}

const pageMeta: Record<string, { title: string; description: string }> = {
  "/app":           { title: "Tableau de bord",      description: "Vue d'ensemble de votre activité" },
  "/app/business":  { title: "Entreprise",            description: "Gérez les informations de votre établissement" },
  "/app/qr":        { title: "QR Codes",              description: "Créez et gérez vos QR codes de collecte d'avis" },
  "/app/feedbacks": { title: "Feedbacks clients",     description: "Consultez et gérez les avis reçus" },
  "/app/stats":     { title: "Statistiques",          description: "Analysez vos performances" },
  "/app/settings":  { title: "Paramètres",            description: "Configurez votre compte et vos notifications" },
}

export function Topbar({ userEmail }: TopbarProps) {
  const pathname = usePathname()
  const meta = pageMeta[pathname] ?? { title: "Tableau de bord", description: "" }

  const initials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : "TR";

  return (
    <div className="space-y-0">
      {/* Subscription Banner */}
      <SubscriptionBanner />
      
      <div
        className="flex h-13 shrink-0 items-center justify-between px-5"
        style={{
          background: "hsl(0 0% 100%)",
          borderBottom: "1px solid hsl(220 13% 91%)",
          minHeight: "52px",
        }}
      >
      {/* Left: breadcrumb + page title */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5" style={{ color: "hsl(220 9% 58%)" }}>
          <span className="text-xs">App</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
        <div>
          <span className="text-sm font-semibold" style={{ color: "hsl(224 71% 4%)", letterSpacing: "-0.01em" }}>{meta.title}</span>
          {meta.description && (
            <span className="ml-2 text-xs hidden md:inline" style={{ color: "hsl(220 9% 55%)" }}>— {meta.description}</span>
          )}
        </div>
        {/* Business Switcher */}
        <BusinessSwitcher />
      </div>

      {/* Right: user avatar */}
      <div className="flex items-center gap-2.5">
        <div className="text-right hidden sm:block">
          <p className="text-xs truncate max-w-[160px]" style={{ color: "hsl(220 9% 55%)" }}>{userEmail}</p>
        </div>
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shrink-0"
          style={{ background: "linear-gradient(135deg, hsl(226 71% 52%), hsl(248 70% 58%))" }}
        >
          {initials}
        </div>
      </div>
      </div>
    </div>
  )
}
