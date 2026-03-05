"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface Stats {
  averageRating: number;
  totalRatings: number;
  totalFeedbacks: number;
  totalReviews: number;
  positiveRate: number;
  ratingDistribution?: number[]; // Distribution réelle de l'API
}

interface RatingDistribution {
  stars: number;
  count: number;
  percentage: number;
}

interface QRCodeItem {
  id: string;
  name: string;
  location: string;
  is_active: boolean;
  scan_count: number;
}

export default function Stats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [ratingDistribution, setRatingDistribution] = useState<RatingDistribution[]>([]);
  const [qrCodes, setQrCodes] = useState<QRCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [response, qrResponse] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/qr-codes"),
      ]);
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data);
      if (qrResponse.ok) {
        const qrData = await qrResponse.json();
        const qrs: QRCodeItem[] = qrData.qrCodes || [];
        if (Array.isArray(qrs)) {
          setQrCodes(qrs.sort((a, b) => (b.scan_count || 0) - (a.scan_count || 0)));
        } else {
          setQrCodes([]);
        }
      }

      // Use the real rating distribution from API if available, otherwise calculate
      let distribution: RatingDistribution[];
      
      if (data.ratingDistribution && Array.isArray(data.ratingDistribution) && data.ratingDistribution.length === 5) {
        // Convertir la distribution de l'API [count1, count2, count3, count4, count5]
        distribution = data.ratingDistribution.map((count: number, index: number) => ({
          stars: index + 1,
          count: count,
          percentage: data.totalReviews > 0 ? Math.round((count / data.totalReviews) * 100) : 0
        }));
        console.log('✅ Using real distribution from API:', distribution);
      } else {
        // Fallback: calculer la distribution (ancienne méthode)
        distribution = calculateRatingDistribution(data.totalReviews, data.averageRating);
        console.log('⚠️ Using calculated distribution (fallback):', distribution);
      }
      
      setRatingDistribution(distribution);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  const calculateRatingDistribution = (totalReviews: number, averageRating: number): RatingDistribution[] => {
    if (totalReviews === 0) {
      return [
        { stars: 5, count: 0, percentage: 0 },
        { stars: 4, count: 0, percentage: 0 },
        { stars: 3, count: 0, percentage: 0 },
        { stars: 2, count: 0, percentage: 0 },
        { stars: 1, count: 0, percentage: 0 },
      ];
    }

    // Simple distribution based on average rating
    const distribution: RatingDistribution[] = [
      { stars: 5, count: 0, percentage: 0 },
      { stars: 4, count: 0, percentage: 0 },
      { stars: 3, count: 0, percentage: 0 },
      { stars: 2, count: 0, percentage: 0 },
      { stars: 1, count: 0, percentage: 0 },
    ];

    // Distribute ratings based on average
    const remaining = totalReviews;
    const avg = averageRating;

    if (avg >= 4.5) {
      distribution[0].count = Math.round(totalReviews * 0.6);
      distribution[1].count = Math.round(totalReviews * 0.3);
      distribution[2].count = totalReviews - distribution[0].count - distribution[1].count;
    } else if (avg >= 3.5) {
      distribution[0].count = Math.round(totalReviews * 0.3);
      distribution[1].count = Math.round(totalReviews * 0.4);
      distribution[2].count = Math.round(totalReviews * 0.2);
      distribution[3].count = totalReviews - distribution[0].count - distribution[1].count - distribution[2].count;
    } else {
      distribution[1].count = Math.round(totalReviews * 0.2);
      distribution[2].count = Math.round(totalReviews * 0.3);
      distribution[3].count = Math.round(totalReviews * 0.3);
      distribution[4].count = totalReviews - distribution[1].count - distribution[2].count - distribution[3].count;
    }

    // Calculate percentages
    distribution.forEach(item => {
      item.percentage = totalReviews > 0 ? Math.round((item.count / totalReviews) * 100) : 0;
    });

    return distribution;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor:"hsl(226 71% 55%)" }} />
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

  const starBarColor = (stars: number) => {
    if (stars >= 4) return "linear-gradient(90deg, hsl(142 72% 42%), hsl(142 72% 50%))";
    if (stars === 3) return "linear-gradient(90deg, hsl(38 92% 48%), hsl(38 92% 56%))";
    return "linear-gradient(90deg, hsl(0 84% 55%), hsl(0 84% 62%))";
  };

  const summaryRows = [
    {
      label: "Total interactions",
      value: stats?.totalReviews || 0,
      chip: null,
    },
    {
      label: "Taux de feedback",
      value: `${stats?.totalReviews && stats.totalReviews > 0
        ? Math.round(((stats?.totalFeedbacks || 0) / stats.totalReviews) * 100)
        : 0}%`,
      chip: "chip-slate",
    },
    {
      label: "Satisfaction clients",
      value: `${stats?.positiveRate || 0}%`,
      chip: (stats?.positiveRate || 0) >= 70 ? "chip-teal" : (stats?.positiveRate || 0) >= 40 ? "chip-amber" : "chip-red",
    },
  ];

  const positiveRate = stats?.positiveRate || 0;
  const maxScans = qrCodes[0]?.scan_count || 1;

  return (
    <div className="space-y-4 animate-fadein">

      {/* ── Page header ─────────────────────────── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Statistiques</h1>
          <p className="page-desc">Analysez les performances de votre collecte d&apos;avis</p>
        </div>
      </div>

      {/* ── KPI cards — color accents ────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:"Avis reçus",   value: stats?.totalReviews || 0,     sub:"Total collecté",   accent:"card-kpi-yellow", iconBg:"icon-bg-yellow", icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
          { label:"Note moyenne", value: `${stats?.averageRating.toFixed(1) || "0.0"}/5`, sub:"Sur 5 étoiles", accent:"card-kpi-blue", iconBg:"icon-bg-blue", icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg> },
          { label:"Feedbacks",    value: stats?.totalFeedbacks || 0,   sub:"Messages privés",  accent:"card-kpi-purple", iconBg:"icon-bg-purple", icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
          { label:"Satisfaction", value: `${positiveRate}%`,           sub:"Notes ≥ 4 étoiles", accent:"card-kpi-green", iconBg:"icon-bg-green", chip: positiveRate >= 70 ? "teal" : positiveRate >= 40 ? "amber" : "slate", icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
        ].map(({ label, value, sub, accent, iconBg, icon, chip }: { label:string; value:string|number; sub:string; accent:string; iconBg:string; icon:React.ReactNode; chip?:string }) => (
          <div key={label} className={`card-stat ${accent} p-4 hover-lift`}>
            <div className="flex items-center justify-between mb-3">
              <span className="kpi-label">{label}</span>
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 ${iconBg}`}>{icon}</div>
            </div>
            <div className="kpi-value">{value}</div>
            <div className="flex items-center gap-1.5 mt-1.5">
              {chip === "teal"  && <span className="chip chip-teal"  style={{ fontSize:"0.6rem", padding:"1px 6px" }}>Bon</span>}
              {chip === "amber" && <span className="chip chip-amber" style={{ fontSize:"0.6rem", padding:"1px 6px" }}>Moyen</span>}
              {chip === "slate" && <span className="chip chip-slate" style={{ fontSize:"0.6rem", padding:"1px 6px" }}>Faible</span>}
              <span className="kpi-sub">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Distribution + Summary ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Distribution */}
        <div className="card-enhanced p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Distribution des notes</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Répartition des {stats?.totalReviews || 0} avis</p>
          </div>
          <div className="space-y-3">
            {[...ratingDistribution].reverse().map((rating) => (
              <div key={rating.stars} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-12 shrink-0">
                  <span className="text-xs font-semibold text-foreground">{rating.stars}</span>
                  <span style={{ color:"hsl(38 92% 52%)", fontSize:"11px" }}>★</span>
                </div>
                <div className="flex-1 rounded-full overflow-hidden" style={{ height:"8px", background:"hsl(220 14% 93%)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width:`${rating.percentage}%`, background: starBarColor(rating.stars) }}
                  />
                </div>
                <div className="w-20 text-right shrink-0">
                  <span className="text-xs text-muted-foreground">{rating.count} <span className="text-foreground font-medium">({rating.percentage}%)</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="card-enhanced p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Résumé des performances</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Vue d&apos;ensemble de vos résultats</p>
          </div>
          <div className="space-y-2.5">
            {summaryRows.map(({ label, value, chip }) => (
              <div key={label} className="flex items-center justify-between py-3 px-4 rounded-lg"
                style={{ background:"hsl(220 18% 98%)", border:"1px solid hsl(220 13% 92%)" }}>
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <div className="flex items-center gap-2">
                  {chip && <span className={`chip ${chip}`}>{typeof value === "string" && value.endsWith("%") ? (parseInt(value) >= 70 ? "Bon" : parseInt(value) >= 40 ? "Moyen" : "Faible") : ""}</span>}
                  <span className="text-sm font-bold text-foreground">{value}</span>
                </div>
              </div>
            ))}

            {/* Rating visual */}
            {stats && stats.averageRating > 0 && (
              <div className="pt-2">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-muted-foreground">Note globale</span>
                  <span className="text-xs font-bold text-foreground">{stats.averageRating.toFixed(1)} / 5</span>
                </div>
                <div className="rounded-full overflow-hidden" style={{ height:"6px", background:"hsl(220 14% 93%)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width:`${(stats.averageRating / 5) * 100}%`,
                      background:"linear-gradient(90deg, hsl(226 71% 55%), hsl(262 83% 58%))",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── QR Performance ─────────────────────────────── */}
      {qrCodes.length > 0 && (
        <div className="card-enhanced p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Performance des QR codes</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{qrCodes.length} code{qrCodes.length > 1 ? 's' : ''} actifs · scans cumulés</p>
            </div>
            <span className="text-xs font-bold text-foreground">{qrCodes.reduce((s, q) => s + (q.scan_count || 0), 0)} scans</span>
          </div>
          <div className="space-y-3">
            {qrCodes.map((qr, i) => {
              const pct = maxScans > 0 ? Math.round(((qr.scan_count || 0) / maxScans) * 100) : 0;
              return (
                <div key={qr.id} className={`animate-fadein stagger-${Math.min(i + 1, 5)}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono font-bold shrink-0" style={{ color:"hsl(220 9% 60%)", fontSize:"0.65rem" }}>#{i + 1}</span>
                      <p className="text-xs font-semibold text-foreground truncate">{qr.name}</p>
                      {qr.location && <span className="text-xs truncate" style={{ color:"hsl(220 9% 60%)", fontSize:"0.68rem" }}>· {qr.location}</span>}
                      {!qr.is_active && <span className="chip chip-slate shrink-0" style={{ fontSize:"0.58rem", padding:"0px 4px" }}>off</span>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-foreground">{qr.scan_count || 0}</span>
                      <span className="text-xs" style={{ color:"hsl(220 9% 60%)", fontSize:"0.65rem" }}>scans</span>
                    </div>
                  </div>
                  <div className="scan-bar-track">
                    <div className="scan-bar-fill" style={{ width:`${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Export ───────────────────────────────────────────── */}
      <div className="card-muted rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Exporter les données</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Téléchargez vos données analytiques</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, label:"CSV Export", sub:"Données brutes" },
            { icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, label:"Rapport PDF", sub:"Synthèse mensuelle" },
            { icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/></svg>, label:"QR Analytics", sub:"Performance scans" },
          ].map(({ icon, label, sub }) => (
            <Button key={label} variant="outline" className="h-auto py-3 px-4 justify-start gap-3 bg-white hover:bg-slate-50">
              <div className="flex h-7 w-7 items-center justify-center rounded-md shrink-0" style={{ background:"hsl(226 100% 96%)", color:"hsl(226 71% 55%)" }}>
                {icon}
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
