"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

function SectionHeader({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  )
}

function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none shrink-0 disabled:opacity-50"
      style={{ background: checked ? "hsl(226 71% 55%)" : "hsl(220 13% 85%)" }}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  )
}

export default function Settings() {
  const [notifNewReview, setNotifNewReview] = useState(true)
  const [notifLowRating, setNotifLowRating] = useState(true)
  const [weeklySummary, setWeeklySummary] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryMsg, setSummaryMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Charger les préférences depuis la base
  useEffect(() => {
    loadPreferences()
  }, [])

  async function loadPreferences() {
    try {
      const res = await fetch("/api/business/current")
      if (res.ok) {
        const business = await res.json()
        setNotifNewReview(business.notif_new_review !== false) // true par défaut
        setNotifLowRating(business.notif_low_rating !== false) // true par défaut
      }
    } catch (error) {
      console.error("Erreur chargement préférences:", error)
    } finally {
      setLoading(false)
    }
  }

  async function savePreference(key: string, value: boolean) {
    setSaving(true)
    try {
      const res = await fetch("/api/business", {
        method: "POST",
        body: new FormData(document.createElement('form')),
      })
      
      // Créer FormData manuellement
      const formData = new FormData()
      formData.append(key, value.toString())
      
      const saveRes = await fetch("/api/business", {
        method: "POST",
        body: formData,
      })
      
      if (!saveRes.ok) {
        console.error("Erreur sauvegarde préférence")
      }
    } catch (error) {
      console.error("Erreur sauvegarde:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleNotifNewReviewChange = (value: boolean) => {
    setNotifNewReview(value)
    savePreference("notif_new_review", value)
  }

  const handleNotifLowRatingChange = (value: boolean) => {
    setNotifLowRating(value)
    savePreference("notif_low_rating", value)
  }

  async function sendWeeklySummary() {
    setSummaryLoading(true)
    setSummaryMsg(null)
    try {
      const res = await fetch("/api/weekly-summary", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setSummaryMsg({ text: "Récapitulatif envoyé avec succès !", ok: true })
      } else {
        setSummaryMsg({ text: data.message || data.error || "Erreur lors de l'envoi", ok: false })
      }
    } catch {
      setSummaryMsg({ text: "Erreur réseau", ok: false })
    } finally {
      setSummaryLoading(false)
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">

      {/* Page header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Paramètres</h1>
          <p className="page-desc">Notifications, compte et préférences</p>
        </div>
      </div>

      {/* Notifications */}
      <div className="card-enhanced p-5">
        <SectionHeader
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          }
          title="Notifications email"
          description="Choisissez les alertes que vous souhaitez recevoir par email."
        />

        <div className="space-y-3">
          {/* Nouvel avis */}
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Nouvel avis reçu</p>
              <p className="text-xs text-muted-foreground mt-0.5">Recevez un email à chaque nouvel avis client</p>
            </div>
            <Toggle checked={notifNewReview} onChange={handleNotifNewReviewChange} disabled={saving} />
          </div>

          {/* Note faible */}
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Alerte note négative</p>
              <p className="text-xs text-muted-foreground mt-0.5">Alerte immédiate pour les avis 1–3 étoiles</p>
            </div>
            <Toggle checked={notifLowRating} onChange={handleNotifLowRatingChange} disabled={saving} />
          </div>

          {/* Récap hebdo toggle */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Récapitulatif hebdomadaire</p>
              <p className="text-xs text-muted-foreground mt-0.5">Résumé de vos performances chaque lundi matin</p>
            </div>
            <Toggle checked={weeklySummary} onChange={setWeeklySummary} />
          </div>
        </div>

        <div className="mt-3 p-3 rounded-lg flex items-start gap-2" style={{ background:"hsl(226 100% 97%)", border:"1px solid hsl(226 100% 90%)" }}>
          <svg className="shrink-0 mt-0.5" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="hsl(226 71% 55%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p className="text-xs" style={{ color:"hsl(226 50% 45%)" }}>L&apos;email de notification est configuré dans la page <strong>Entreprise</strong>.</p>
        </div>
      </div>

      {/* Récap hebdo — envoi immédiat */}
      <div className="card-enhanced p-5">
        <SectionHeader
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          }
          title="Récapitulatif hebdomadaire"
          description="Envoyez-vous un résumé de vos performances de la semaine passée."
        />

        <div className="rounded-lg p-4 mb-4" style={{ background:"hsl(220 18% 98%)", border:"1px solid hsl(220 13% 91%)" }}>
          <p className="text-xs text-muted-foreground mb-1 font-medium">Ce récapitulatif inclut :</p>
          <ul className="text-xs text-muted-foreground space-y-1 mt-2">
            <li className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-primary inline-block shrink-0" />
              Nombre total de nouveaux avis sur 7 jours
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-primary inline-block shrink-0" />
              Note moyenne et taux de satisfaction
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-primary inline-block shrink-0" />
              Les 3 derniers commentaires reçus
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-primary inline-block shrink-0" />
              Un conseil personnalisé selon vos résultats
            </li>
          </ul>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={sendWeeklySummary}
            disabled={summaryLoading}
            size="sm"
          >
            {summaryLoading ? (
              <>
                <svg className="animate-spin mr-1.5" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Envoi…
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                Envoyer maintenant
              </>
            )}
          </Button>

          {summaryMsg && (
            <span
              className="text-xs font-medium"
              style={{ color: summaryMsg.ok ? "hsl(142 72% 42%)" : "hsl(0 84% 55%)" }}
            >
              {summaryMsg.ok ? "✓" : "✗"} {summaryMsg.text}
            </span>
          )}
        </div>
      </div>

      {/* Compte */}
      <div className="card-enhanced p-5">
        <SectionHeader
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          }
          title="Compte"
          description="Informations liées à votre authentification."
        />
        <div className="rounded-lg p-4 text-sm text-muted-foreground" style={{ background:"hsl(220 18% 98%)", border:"1px solid hsl(220 13% 91%)" }}>
          La connexion se fait via <strong className="text-foreground">lien magique</strong> — aucun mot de passe n&apos;est stocké. Pour modifier votre adresse email, contactez le support.
        </div>
      </div>

      {/* Zone dangereuse */}
      <div className="card-enhanced p-5" style={{ borderColor: "hsl(0 84% 60% / 0.3)" }}>
        <SectionHeader
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(0 84% 60%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          }
          title="Zone dangereuse"
          description="Actions irréversibles affectant définitivement votre compte."
        />
        <div className="rounded-lg p-4" style={{ background: "hsl(0 84% 60% / 0.05)", border: "1px solid hsl(0 84% 60% / 0.2)" }}>
          <p className="text-xs text-muted-foreground mb-3">
            La suppression de votre compte supprime définitivement toutes vos données (entreprise, QR codes, feedbacks). Cette action est <strong>irréversible</strong>.
          </p>
          <Button variant="destructive" size="sm">
            Supprimer mon compte
          </Button>
        </div>
      </div>

    </div>
  )
}
