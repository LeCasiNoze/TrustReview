"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

function isNew(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000;
}

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

function StarRow({ n, size = 11 }: { n: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 1.5 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= n
            ? (n >= 4 ? "hsl(38 92% 52%)" : n === 3 ? "hsl(38 85% 60%)" : "hsl(0 84% 58%)")
            : "hsl(220 13% 88%)"}
          stroke="none">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

interface Feedback {
  id: string;
  stars?: number;
  message?: string;
  created_at: string;
  type: "rating" | "feedback";
  read: boolean;
}

interface Stats {
  totalRatings: number;
  totalFeedbacks: number;
  averageRating: number;
  positiveRate: number;
}

type SortOption = "date-desc" | "date-asc" | "rating-desc" | "rating-asc" | "unread-first";
type FilterOption = "all" | "with-comment" | "without-comment" | "unread" | "read";

export default function Feedbacks() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [selectedFeedbacks, setSelectedFeedbacks] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [feedbacks, sortBy, filterBy]);

  const fetchData = async () => {
    try {
      // Fetch feedbacks
      const feedbacksResponse = await fetch("/api/feedbacks");
      if (feedbacksResponse.ok) {
        const feedbacksData = await feedbacksResponse.json();
        
        // Fetch read statuses for all feedbacks
        const feedbackIds = feedbacksData.map((f: Feedback) => f.id).join(',');
        const readStatusResponse = await fetch(`/api/feedbacks/read-status?feedbackIds=${feedbackIds}`);
        
        let readStatusMap: Record<string, boolean> = {};
        if (readStatusResponse.ok) {
          readStatusMap = await readStatusResponse.json();
        }
        
        // Add read status to feedbacks
        const feedbacksWithRead = feedbacksData.map((f: Feedback) => ({ 
          ...f, 
          read: readStatusMap[f.id] || false 
        }));
        setFeedbacks(feedbacksWithRead);
      }

      // Fetch stats
      const statsResponse = await fetch("/api/stats");
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...feedbacks];

    // Apply filters
    switch (filterBy) {
      case "with-comment":
        filtered = filtered.filter(f => f.message && f.message.trim() !== "");
        break;
      case "without-comment":
        filtered = filtered.filter(f => !f.message || f.message.trim() === "");
        break;
      case "unread":
        filtered = filtered.filter(f => !f.read);
        break;
      case "read":
        filtered = filtered.filter(f => f.read);
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case "date-desc":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "date-asc":
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "rating-desc":
        filtered.sort((a, b) => (b.stars || 0) - (a.stars || 0));
        break;
      case "rating-asc":
        filtered.sort((a, b) => (a.stars || 0) - (b.stars || 0));
        break;
      case "unread-first":
        filtered.sort((a, b) => {
          if (a.read === b.read) return 0;
          return a.read ? 1 : -1;
        });
        break;
    }

    setFilteredFeedbacks(filtered);
  };

  const toggleReadStatus = async (feedbackId: string) => {
    const feedback = feedbacks.find(f => f.id === feedbackId);
    if (!feedback) return;

    const newReadStatus = !feedback.read;
    
    // Optimistically update UI
    setFeedbacks(prev => prev.map(f => 
      f.id === feedbackId ? { ...f, read: newReadStatus } : f
    ));

    try {
      // Save to database
      const response = await fetch("/api/feedbacks/read-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedbackId,
          isRead: newReadStatus
        }),
      });

      if (!response.ok) {
        // Revert on error
        setFeedbacks(prev => prev.map(f => 
          f.id === feedbackId ? { ...f, read: !newReadStatus } : f
        ));
        console.error("Failed to update read status");
      }
    } catch (error) {
      // Revert on error
      setFeedbacks(prev => prev.map(f => 
        f.id === feedbackId ? { ...f, read: !newReadStatus } : f
      ));
      console.error("Error updating read status:", error);
    }
  };

  const markAllAsRead = async () => {
    // Optimistically update UI
    const unreadFeedbacks = feedbacks.filter(f => !f.read);
    setFeedbacks(prev => prev.map(f => ({ ...f, read: true })));
    setSelectedFeedbacks([]);

    try {
      // Save all to database
      const promises = unreadFeedbacks.map(feedback =>
        fetch("/api/feedbacks/read-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            feedbackId: feedback.id,
            isRead: true
          }),
        })
      );

      await Promise.all(promises);
    } catch (error) {
      console.error("Error marking all as read:", error);
      // Revert on error
      setFeedbacks(prev => prev.map(f => 
        unreadFeedbacks.find(uf => uf.id === f.id) ? { ...f, read: false } : f
      ));
    }
  };

  const markSelectedAsRead = async () => {
    const selectedFeedbackObjects = feedbacks.filter(f => selectedFeedbacks.includes(f.id));
    
    // Optimistically update UI
    setFeedbacks(prev => prev.map(f => 
      selectedFeedbacks.includes(f.id) ? { ...f, read: true } : f
    ));
    setSelectedFeedbacks([]);

    try {
      // Save selected to database
      const promises = selectedFeedbackObjects.map(feedback =>
        fetch("/api/feedbacks/read-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            feedbackId: feedback.id,
            isRead: true
          }),
        })
      );

      await Promise.all(promises);
    } catch (error) {
      console.error("Error marking selected as read:", error);
      // Revert on error
      setFeedbacks(prev => prev.map(f => 
        selectedFeedbackObjects.find(sf => sf.id === f.id) ? { ...f, read: false } : f
      ));
    }
  };

  const toggleFeedbackSelection = (feedbackId: string) => {
    setSelectedFeedbacks(prev => 
      prev.includes(feedbackId) 
        ? prev.filter(id => id !== feedbackId)
        : [...prev, feedbackId]
    );
  };

  const selectAllVisible = () => {
    if (selectedFeedbacks.length === filteredFeedbacks.length) {
      setSelectedFeedbacks([]);
    } else {
      setSelectedFeedbacks(filteredFeedbacks.map(f => f.id));
    }
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

  const unreadCount = feedbacks.filter(f => !f.read).length;

  const starColor = (stars: number) =>
    stars >= 4 ? "hsl(142 72% 38%)" : stars === 3 ? "hsl(38 92% 40%)" : "hsl(0 84% 55%)";

  const emptyMsg: Record<string, string> = {
    unread: "Aucun feedback non lu — tout est traité !",
    "with-comment": "Aucun feedback avec commentaire.",
    "without-comment": "Aucun feedback sans commentaire.",
    all: "Aucun feedback reçu pour l'instant.",
  };

  return (
    <div className="space-y-4 animate-fadein">

      {/* ── Page header ─────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Feedbacks clients</h1>
          <p className="page-desc">{filteredFeedbacks.length} résultat{filteredFeedbacks.length !== 1 ? 's' : ''}{unreadCount > 0 ? ` · ${unreadCount} non lu${unreadCount > 1 ? 's' : ''}` : ''}</p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline" size="sm">
            Tout marquer lu
          </Button>
        )}
      </div>

      {/* ── Mini stats row — uniform values ─────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:"Total",        value: stats?.totalFeedbacks || 0, sub:"Messages reçus",   icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
          { label:"Non lus",      value: unreadCount,               sub:"En attente",       icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>, accent: unreadCount > 0 ? "amber" : undefined },
          { label:"Note moyenne", value: stats ? `${stats.averageRating.toFixed(1)}/5` : "—", sub:"Sur 5 étoiles", icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
          { label:"Satisfaction", value: `${stats?.positiveRate || 0}%`, sub:"Notes ≥ 4 étoiles", icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, accent: (stats?.positiveRate||0) >= 70 ? "teal" : (stats?.positiveRate||0) >= 40 ? "amber" : undefined },
        ].map(({ label, value, sub, icon, accent }: { label:string; value:string|number; sub:string; icon:React.ReactNode; accent?:string }) => (
          <div key={label} className="card-enhanced p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="kpi-label">{label}</span>
              <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background:"hsl(220 14% 95%)", color:"hsl(220 9% 45%)" }}>{icon}</div>
            </div>
            <div className="kpi-value">{value}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {accent === "teal"  && <span className="chip chip-teal"  style={{ fontSize:"0.6rem", padding:"1px 6px" }}>Bon</span>}
              {accent === "amber" && <span className="chip chip-amber" style={{ fontSize:"0.6rem", padding:"1px 6px" }}>Attention</span>}
              <span className="kpi-sub">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ─────────────────────────────────── */}
      <div className="card-enhanced p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Trier par</label>
            <Select value={sortBy} onValueChange={(value: string) => setSortBy(value as SortOption)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Trier par..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (plus récent)</SelectItem>
                <SelectItem value="date-asc">Date (plus ancien)</SelectItem>
                <SelectItem value="rating-desc">Note (plus haute)</SelectItem>
                <SelectItem value="rating-asc">Note (plus basse)</SelectItem>
                <SelectItem value="unread-first">Non lus en premier</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Filtrer</label>
            <Select value={filterBy} onValueChange={(value: string) => setFilterBy(value as FilterOption)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Filtrer..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="with-comment">Avec commentaire</SelectItem>
                <SelectItem value="without-comment">Sans commentaire</SelectItem>
                <SelectItem value="unread">Non lus</SelectItem>
                <SelectItem value="read">Lus</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={selectAllVisible} variant="outline" size="sm" className="h-8 text-xs">
              {selectedFeedbacks.length === filteredFeedbacks.length && filteredFeedbacks.length > 0 ? "Tout désélectionner" : "Tout sélectionner"}
            </Button>
            {selectedFeedbacks.length > 0 && (
              <Button onClick={markSelectedAsRead} size="sm" className="h-8 text-xs">
                Lu ({selectedFeedbacks.length})
              </Button>
            )}
            {unreadCount > 0 && selectedFeedbacks.length === 0 && (
              <Button onClick={markAllAsRead} variant="outline" size="sm" className="h-8 text-xs">
                Tout marquer lu
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── List ────────────────────────────────────── */}
      <div className="card-enhanced overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom:"1px solid hsl(220 13% 91%)", background:"hsl(220 18% 98%)" }}>
          <span className="text-xs font-semibold text-foreground">Feedbacks ({filteredFeedbacks.length})</span>
          {unreadCount > 0 && (
            <span className="chip chip-amber">{unreadCount} non lu{unreadCount > 1 ? 's' : ''}</span>
          )}
        </div>

        {/* Empty state */}
        {filteredFeedbacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full mb-4"
              style={{ background:"hsl(220 14% 94%)", border:"1px solid hsl(220 13% 88%)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="hsl(220 9% 55%)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              {filterBy === "unread" ? "Tout est traité !" : "Aucun feedback"}
            </p>
            <p className="text-xs text-muted-foreground">
              {emptyMsg[filterBy] || emptyMsg.all}
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor:"hsl(220 13% 91%)" }}>
            {filteredFeedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className="px-5 py-4 transition-colors duration-100 hover:bg-slate-50"
                style={!feedback.read ? { background:"hsl(226 100% 98.5%)" } : {}}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <Checkbox
                    checked={selectedFeedbacks.includes(feedback.id)}
                    onCheckedChange={() => toggleFeedbackSelection(feedback.id)}
                    className="mt-0.5 shrink-0"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Top row: chips + action */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Stars visual row */}
                        {feedback.stars && (
                          <span className="chip" style={{
                            background: feedback.stars >= 4 ? "hsl(38 100% 93%)" : feedback.stars === 3 ? "hsl(38 100% 95%)" : "hsl(0 100% 95%)",
                            border: `1px solid ${feedback.stars >= 4 ? "hsl(38 92% 82%)" : feedback.stars === 3 ? "hsl(38 85% 85%)" : "hsl(0 84% 87%)"}`,
                            gap: "5px",
                          }}>
                            <StarRow n={feedback.stars} size={9} />
                            <span style={{ color: feedback.stars >= 4 ? "hsl(38 82% 30%)" : feedback.stars === 3 ? "hsl(38 75% 35%)" : "hsl(0 84% 42%)", fontWeight: 700 }}>{feedback.stars}/5</span>
                          </span>
                        )}
                        {/* Type chip */}
                        <span className={feedback.type === "rating" ? "chip chip-blue" : "chip chip-purple"}>
                          {feedback.type === "rating" ? "Notation" : "Feedback"}
                        </span>
                        {/* Nouveau chip */}
                        {isNew(feedback.created_at) && (
                          <span className="chip chip-new" style={{ fontSize:"0.6rem" }}>Nouveau</span>
                        )}
                        {/* Unread dot */}
                        {!feedback.read && (
                          <span className="chip chip-amber" style={{ fontSize:"0.6rem" }}>Non lu</span>
                        )}
                      </div>

                      <Button
                        onClick={() => toggleReadStatus(feedback.id)}
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs shrink-0 text-muted-foreground"
                      >
                        {feedback.read ? "Non lu" : "Lu"}
                      </Button>
                    </div>

                    {/* Message */}
                    {feedback.message ? (
                      <p className="text-sm text-foreground leading-relaxed mb-1.5">{feedback.message}</p>
                    ) : (
                      <p className="text-xs italic text-muted-foreground mb-1.5">Aucun commentaire</p>
                    )}

                    {/* Date + relative time */}
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {new Date(feedback.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric", month: "long", year: "numeric",
                        })}
                      </p>
                      <span className="meta-dot" />
                      <p className="text-xs text-muted-foreground">{timeAgo(feedback.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
