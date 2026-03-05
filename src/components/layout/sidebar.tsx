"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navigation = [
  {
    name: "Tableau de bord",
    href: "/app",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    name: "Entreprises",
    href: "/app/businesses",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    name: "QR Codes",
    href: "/app/qr",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/>
        <rect x="3" y="16" width="5" height="5"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/>
        <line x1="21" y1="21" x2="21" y2="21"/><path d="M14 3v3a1 1 0 0 0 1 1h3"/>
        <path d="M14 11v1"/><path d="M17 11h3"/>
      </svg>
    ),
  },
  {
    name: "Feedbacks",
    href: "/app/feedbacks",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    name: "Statistiques",
    href: "/app/stats",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    ),
  },
  {
    name: "Facturation",
    href: "/app/billing",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
  {
    name: "Paramètres",
    href: "/app/settings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14M12 2v2M12 20v2M2 12h2M20 12h2"/>
      </svg>
    ),
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-60 flex-col" style={{ background: "hsl(224 71% 4%)", borderRight: "1px solid hsl(224 40% 10%)" }}>
      {/* Logo */}
      <div className="flex h-16 items-center px-5" style={{ borderBottom: "1px solid hsl(224 40% 10%)" }}>
        <Link href="/app" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "linear-gradient(135deg, hsl(226 71% 55%), hsl(262 83% 58%))" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight" style={{ color: "hsl(0 0% 95%)" }}>TrustReview</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-4 space-y-0.5">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "text-white"
                  : "hover:text-white"
              )}
              style={isActive ? {
                background: "hsl(226 71% 55% / 0.18)",
                color: "hsl(226 100% 82%)",
                border: "1px solid hsl(226 71% 55% / 0.25)",
              } : {
                color: "hsl(220 10% 55%)",
              }}
            >
              <span className="shrink-0">{item.icon}</span>
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-2.5 pb-4" style={{ borderTop: "1px solid hsl(224 40% 10%)", paddingTop: "1rem" }}>
        <Link
          href="/auth/logout"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
          style={{ color: "hsl(220 10% 45%)" }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = "hsl(0 70% 50% / 0.1)"
            ;(e.currentTarget as HTMLAnchorElement).style.color = "hsl(0 84% 65%)"
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = "transparent"
            ;(e.currentTarget as HTMLAnchorElement).style.color = "hsl(220 10% 45%)"
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Déconnexion
        </Link>
      </div>
    </div>
  )
}
