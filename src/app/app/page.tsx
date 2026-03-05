"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Business } from "@/lib/business-manager";

interface Stats {
  totalRatings: number;
  totalFeedbacks: number;
  averageRating: number;
  positiveRate: number;
}

interface RecentFeedback {
  id: string;
  stars?: number;
  message?: string;
  created_at: string;
  type: "rating" | "feedback";
  read?: boolean;
}

interface QRCodeItem {
  id: string;
  name: string;
  location: string;
  is_active: boolean;
  scan_count: number;
}

/* ── Helpers ──────────────────────────────────────── */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `il y a ${d}j`;
}

function isNew(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000;
}

function StarRow({ n, size = 10 }: { n: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 1.5 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= n
            ? (n >= 4 ? "hsl(38 92% 52%)" : n === 3 ? "hsl(38 92% 68%)" : "hsl(0 84% 60%)")
            : "hsl(220 13% 88%)"}
          stroke="none">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

/* ── Component ──────────────────────────────────────── */
export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentFeedback[]>([]);
  const [topQRs, setTopQRs] = useState<QRCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [statsRes, businessRes, feedbacksRes, qrRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/business/current"),
        fetch("/api/feedbacks"),
        fetch("/api/qr-codes"),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (businessRes.ok) setBusiness(await businessRes.json());
      if (feedbacksRes.ok) {
        const data: RecentFeedback[] = await feedbacksRes.json();
        setRecentActivity(
          data
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5)
        );
      }
      if (qrRes.ok) {
        const qrData = await qrRes.json();
        const qrs: QRCodeItem[] = qrData.qrCodes || [];
        if (Array.isArray(qrs)) {
          setTopQRs(qrs.sort((a, b) => (b.scan_count || 0) - (a.scan_count || 0)).slice(0, 4));
        } else {
          setTopQRs([]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "hsl(226 71% 55%)" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-enhanced p-5">
        <p className="text-sm font-semibold text-destructive">Erreur</p>
        <p className="text-xs text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  const positiveRate = stats?.positiveRate || 0;
  const maxScans = topQRs[0]?.scan_count || 1;

  const kpis = [
    {
      label: "Avis reçus", value: stats?.totalRatings ?? 0, sub: "Total collecté",
      accent: "card-kpi-yellow", iconBg: "icon-bg-yellow",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    },
    {
      label: "Note moyenne", value: stats ? `${stats.averageRating.toFixed(1)}/5` : "—", sub: "Sur 5 étoiles",
      accent: "card-kpi-blue", iconBg: "icon-bg-blue",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
    },
    {
      label: "Feedbacks", value: stats?.totalFeedbacks ?? 0, sub: "Messages privés",
      accent: "card-kpi-purple", iconBg: "icon-bg-purple",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    },
    {
      label: "Satisfaction", value: `${positiveRate}%`, sub: "Notes ≥ 4 étoiles",
      accent: "card-kpi-green", iconBg: "icon-bg-green",
      chip: positiveRate >= 70 ? "teal" : positiveRate >= 40 ? "amber" : undefined,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    },
  ];

  return (
    <div className="space-y-5 animate-fadein">

      {/* ══ HERO ══════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl"
        style={{
          background: "linear-gradient(135deg, hsl(224 65% 6%) 0%, hsl(227 60% 11%) 55%, hsl(262 50% 13%) 100%)",
          border: "1px solid hsl(226 40% 17%)",
          boxShadow: "0 4px 24px rgba(10,14,60,0.4)",
          padding: "2rem 2rem 1.75rem",
          minHeight: 156,
        }}>
        {/* Grid texture */}
        <div className="hero-grid" />
        {/* Glow orbs */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div style={{ position:"absolute", top:"-35%", right:"12%", width:"320px", height:"240px", background:"radial-gradient(ellipse, hsla(226,71%,65%,0.13) 0%, transparent 65%)", filter:"blur(36px)" }} />
          <div style={{ position:"absolute", bottom:"-50%", left:"3%", width:"220px", height:"220px", background:"radial-gradient(ellipse, hsla(262,83%,65%,0.09) 0%, transparent 65%)", filter:"blur(36px)" }} />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex-1 min-w-0">
            {/* Status + last activity */}
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"2px 9px", borderRadius:99, fontSize:"0.65rem", fontWeight:600, background:"hsla(226,71%,60%,0.16)", color:"hsl(226 100% 78%)", border:"1px solid hsla(226,71%,60%,0.22)" }}>
                <span style={{ width:5, height:5, borderRadius:"50%", background:"hsl(172 60% 55%)", display:"inline-block" }} />
                {business?.is_active !== false ? "Actif" : "Inactif"}
              </span>
              {recentActivity.length > 0 && (
                <span style={{ fontSize:"0.65rem", color:"hsla(220,15%,58%,1)" }}>
                  Dernier avis {timeAgo(recentActivity[0].created_at)}
                </span>
              )}
            </div>
            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-bold text-white truncate" style={{ letterSpacing:"-0.03em" }}>
              {business ? business.name : "Bienvenue dans TrustReview"}
            </h1>
            <p className="text-xs mt-1 font-mono" style={{ color:"hsla(220,15%,52%,1)" }}>
              trustreview.app/r/<span style={{ color:"hsla(220,15%,74%,1)" }}>{business?.slug || "—"}</span>
            </p>
          </div>

          {/* Hero right: avg rating + CTAs */}
          <div className="flex items-center gap-5 shrink-0">
            {stats && stats.averageRating > 0 && (
              <div className="text-center hidden sm:block">
                <div className="text-4xl font-black text-white" style={{ letterSpacing:"-0.05em", lineHeight:1 }}>
                  {stats.averageRating.toFixed(1)}
                </div>
                <div className="flex justify-center mt-1">
                  <StarRow n={Math.round(stats.averageRating)} size={11} />
                </div>
                <p className="text-xs mt-1" style={{ color:"hsla(220,15%,52%,1)", fontSize:"0.65rem" }}>
                  Note moyenne · {stats.totalRatings} avis
                </p>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Link href="/app/qr">
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium w-full transition-all duration-150"
                  style={{ background:"hsla(220,20%,100%,0.08)", border:"1px solid hsla(220,20%,100%,0.13)", color:"hsla(220,20%,85%,1)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "hsla(220,20%,100%,0.13)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "hsla(220,20%,100%,0.08)"; }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/></svg>
                  QR Codes
                </button>
              </Link>
              <Link href="/app/feedbacks">
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold w-full transition-all duration-150"
                  style={{ background:"hsl(226 71% 55%)", color:"white", border:"1px solid hsl(226 71% 47%)", boxShadow:"0 2px 8px hsla(226,71%,40%,0.35)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "hsl(226 71% 50%)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "hsl(226 71% 55%)"; }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Feedbacks
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ══ KPI GRID — colored accent bars ════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(({ label, value, sub, accent, iconBg, icon, chip }) => (
          <div key={label} className={`card-stat ${accent} p-4 hover-lift`}>
            <div className="flex items-center justify-between mb-3">
              <span className="kpi-label">{label}</span>
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 ${iconBg}`}>
                {icon}
              </div>
            </div>
            <div className="kpi-value">{value}</div>
            <div className="flex items-center gap-1.5 mt-1.5">
              {chip === "teal"  && <span className="chip chip-teal"  style={{ fontSize:"0.6rem", padding:"1px 6px" }}>Bon</span>}
              {chip === "amber" && <span className="chip chip-amber" style={{ fontSize:"0.6rem", padding:"1px 6px" }}>Moyen</span>}
              <span className="kpi-sub">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ══ ACTIVITÉ RÉCENTE ══════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* Recent feedbacks — 2/3 */}
        <div className="card-enhanced lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom:"1px solid hsl(220 13% 91%)", background:"hsl(220 18% 98.5%)" }}>
            <div className="flex items-center gap-2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="hsl(226 71% 55%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              <span className="text-xs font-semibold text-foreground">Activité récente</span>
            </div>
            <Link href="/app/feedbacks">
              <span className="text-xs font-medium transition-colors hover:underline" style={{ color:"hsl(226 71% 52%)" }}>
                Voir tout →
              </span>
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <div className="empty-state py-10">
              <div className="empty-state-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <p className="empty-state-title">Aucune activité</p>
              <p className="empty-state-desc">Vos premiers avis apparaîtront ici en temps réel</p>
            </div>
          ) : (
            <div className="px-5">
              {recentActivity.map((item, i) => (
                <div key={item.id} className={`activity-row animate-fadein stagger-${i + 1}`}
                  style={!item.read ? { background:"hsl(226 100% 99.2%)", marginLeft:-20, marginRight:-20, paddingLeft:20, paddingRight:20 } : {}}>
                  {/* Avatar bubble */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      background: item.stars && item.stars >= 4 ? "hsl(142 76% 91%)" : item.stars === 3 ? "hsl(38 100% 93%)" : item.stars ? "hsl(0 100% 95%)" : "hsl(220 14% 94%)",
                      color: item.stars && item.stars >= 4 ? "hsl(142 72% 28%)" : item.stars === 3 ? "hsl(38 82% 32%)" : item.stars ? "hsl(0 84% 42%)" : "hsl(220 9% 50%)",
                    }}>
                    {item.stars ?? "—"}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      {item.stars && <StarRow n={item.stars} size={9} />}
                      <span className={`chip ${item.type === "rating" ? "chip-blue" : "chip-slate"}`} style={{ fontSize:"0.6rem", padding:"1px 5px" }}>
                        {item.type === "rating" ? "Notation" : "Feedback"}
                      </span>
                      {isNew(item.created_at) && (
                        <span className="chip chip-new" style={{ fontSize:"0.6rem", padding:"1px 5px" }}>Nouveau</span>
                      )}
                    </div>
                    <p className="text-xs text-foreground truncate leading-snug">
                      {item.message
                        ? item.message
                        : <span className="italic text-muted-foreground">Aucun commentaire</span>}
                    </p>
                  </div>
                  {/* Time */}
                  <span className="shrink-0" style={{ color:"hsl(220 9% 60%)", fontSize:"0.68rem", whiteSpace:"nowrap" }}>
                    {timeAgo(item.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top QR leaderboard — 1/3 */}
        <div className="card-enhanced overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5"
            style={{ borderBottom:"1px solid hsl(220 13% 91%)", background:"hsl(220 18% 98.5%)" }}>
            <div className="flex items-center gap-2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="hsl(226 71% 55%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/>
              </svg>
              <span className="text-xs font-semibold text-foreground">Top QR codes</span>
            </div>
            <Link href="/app/qr">
              <span className="text-xs font-medium" style={{ color:"hsl(226 71% 52%)" }}>Gérer →</span>
            </Link>
          </div>

          {topQRs.length === 0 ? (
            <div className="empty-state py-8">
              <div className="empty-state-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/></svg>
              </div>
              <p className="empty-state-title" style={{ fontSize:"0.8rem" }}>Aucun QR créé</p>
              <Link href="/app/qr">
                <span className="text-xs" style={{ color:"hsl(226 71% 55%)" }}>Créer le premier →</span>
              </Link>
            </div>
          ) : (
            <div className="p-4 space-y-3.5">
              {topQRs.map((qr, i) => {
                const pct = maxScans > 0 ? Math.round(((qr.scan_count || 0) / maxScans) * 100) : 0;
                return (
                  <div key={qr.id} className={`animate-fadein stagger-${i + 1}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-mono font-bold shrink-0"
                          style={{ color:"hsl(220 9% 65%)", fontSize:"0.65rem" }}>#{i + 1}</span>
                        <p className="text-xs font-semibold text-foreground truncate">{qr.name}</p>
                        {!qr.is_active && (
                          <span className="chip chip-slate shrink-0" style={{ fontSize:"0.58rem", padding:"0px 4px" }}>off</span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-foreground shrink-0 ml-2">{qr.scan_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="scan-bar-track flex-1">
                        <div className="scan-bar-fill" style={{ width:`${pct}%` }} />
                      </div>
                      <span style={{ color:"hsl(220 9% 60%)", fontSize:"0.65rem", flexShrink: 0 }}>scans</span>
                    </div>
                    {qr.location && (
                      <p className="text-xs mt-0.5 truncate" style={{ color:"hsl(220 9% 62%)", fontSize:"0.66rem" }}>
                        {qr.location}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══ BUSINESS + NAV ════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">

        {/* Business info */}
        <div className="card-enhanced p-5 lg:col-span-3">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0" style={{ background:"linear-gradient(135deg, hsl(226 71% 55%), hsl(262 83% 58%))" }}>
                {business?.logo_url ? (
                  <img src={business.logo_url} alt={business.name} className="h-6 w-6 rounded object-cover" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                )}
              </div>
              <div>
                <p className="section-label" style={{ marginBottom:"0.2rem" }}>Votre établissement</p>
                <h3 className="text-base font-semibold text-foreground leading-tight">
                  {business ? business.name : "Aucune entreprise"}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={business?.is_active ? "chip chip-teal" : "chip chip-slate"}>
                {business?.is_active ? "Actif" : "Inactif"}
              </span>
            </div>
          </div>
          
          {business ? (
            <div className="space-y-3 mb-5">
              {/* URL publique */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-slate-50/50">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md shrink-0" style={{ background:"hsl(220 14% 94%)", color:"hsl(220 9% 55%)" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">Page publique</p>
                    <p className="text-xs font-mono text-muted-foreground truncate">trustreview.app/r/{business.slug}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(`https://trustreview.app/r/${business.slug}`)}
                  className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-white text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  title="Copier le lien">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
              </div>

              {/* Google Reviews */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-slate-50/50">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md shrink-0" style={{ background:"hsl(220 14% 94%)", color:"hsl(220 9% 55%)" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">Google Reviews</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {business.google_review_url ? "URL configurée" : "Non configurée"}
                    </p>
                  </div>
                </div>
                {business.google_review_url ? (
                  <span className="chip chip-teal" style={{ fontSize:"0.6rem" }}>✓ Configuré</span>
                ) : (
                  <span className="chip chip-amber" style={{ fontSize:"0.6rem" }}>À faire</span>
                )}
              </div>

              {/* Email notifications */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-slate-50/50">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md shrink-0" style={{ background:"hsl(220 14% 94%)", color:"hsl(220 9% 55%)" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 5L2 7"/></svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">Notifications email</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {business.notification_email ? business.notification_email : "Non configuré"}
                    </p>
                  </div>
                </div>
                {business.notification_email ? (
                  <span className="chip chip-teal" style={{ fontSize:"0.6rem" }}>✓ Actif</span>
                ) : (
                  <span className="chip chip-amber" style={{ fontSize:"0.6rem" }}>À faire</span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full mx-auto mb-3" style={{ background:"hsl(220 14% 94%)", border:"1px solid hsl(220 13% 88%)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="hsl(220 9% 55%)" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <p className="text-sm font-medium text-foreground mb-1">Commencez avec votre entreprise</p>
              <p className="text-xs text-muted-foreground">Configurez vos informations pour activer la collecte d&apos;avis</p>
            </div>
          )}
          
          <Link href="/app/business">
            <Button size="sm" variant={business ? "outline" : "default"} className="w-full">
              {business ? "⚙️ Gérer l'entreprise" : "🚀 Configurer maintenant"}
            </Button>
          </Link>
        </div>

        {/* Quick nav */}
        <div className="card-enhanced p-5 lg:col-span-2">
          <p className="section-label">Navigation rapide</p>
          <div className="space-y-0.5 mt-1">
            {[
              { href:"/app/qr",        label:"QR Codes",     desc:"Créer et télécharger",   col:"hsl(226 71% 55%)", icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/></svg> },
              { href:"/app/stats",     label:"Statistiques", desc:"Performances et notes",  col:"hsl(38 92% 42%)",  icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg> },
              { href:"/app/feedbacks", label:"Feedbacks",    desc:"Avis et commentaires",   col:"hsl(262 83% 55%)", icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
              { href:"/app/settings",  label:"Paramètres",   desc:"Notifications et compte", col:"hsl(220 9% 50%)",  icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg> },
            ].map(({ href, label, desc, col, icon }) => (
              <Link key={href} href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-100"
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "hsl(220 14% 96%)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}>
                <span className="flex h-6 w-6 items-center justify-center rounded-md shrink-0"
                  style={{ background:`color-mix(in srgb, ${col} 13%, transparent)`, color: col }}>
                  {icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground leading-none">{label}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color:"hsl(220 9% 60%)", fontSize:"0.68rem" }}>{desc}</p>
                </div>
                <svg className="ml-auto shrink-0" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="hsl(220 9% 72%)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Getting started — only when no business */}
      {!business && (
        <div className="card-muted rounded-xl p-5">
          <p className="section-label">Démarrage</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
            {[
              { n:"01", title:"Configurer", desc:"Ajoutez les infos de votre établissement" },
              { n:"02", title:"Générer un QR", desc:"Créez votre QR code personnalisé" },
              { n:"03", title:"Collecter", desc:"Partagez et recevez vos premiers avis" },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex items-start gap-3 rounded-lg bg-white p-3.5 border border-border">
                <span className="text-xs font-mono font-bold shrink-0 mt-0.5" style={{ color:"hsl(226 71% 58%)" }}>{n}</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Link href="/app/business"><Button size="sm">Commencer</Button></Link>
          </div>
        </div>
      )}
    </div>
  );
}
