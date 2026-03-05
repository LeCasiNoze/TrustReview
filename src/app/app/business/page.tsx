"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import LogoUpload from "@/components/ui/logo-upload"

interface Business {
  id?: string
  name: string
  slug: string
  google_review_url?: string
  threshold_positive: number
  notification_email?: string
  logo_url?: string
  qr_background_color: string
  qr_foreground_color: string
  qr_text: string
}

interface QRCode {
  id: string
  name: string
  location: string
  is_active: boolean
  scan_count: number
  created_at: string
}

export default function BusinessPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [qrCodes, setQrCodes] = useState<QRCode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    google_review_url: "",
    threshold_positive: 4,
    notification_email: "",
    logo_url: ""
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [businessResponse, qrResponse] = await Promise.all([
        fetch("/api/business/current"),
        fetch("/api/qr-codes")
      ])

      if (businessResponse.ok) {
        const businessData = await businessResponse.json()
        setBusiness(businessData)
        // Remplir le formulaire avec les données existantes
        setFormData({
          name: businessData.name || "",
          slug: businessData.slug || "",
          google_review_url: businessData.google_review_url || "",
          threshold_positive: businessData.threshold_positive || 4,
          notification_email: businessData.notification_email || "",
          logo_url: businessData.logo_url || ""
        })
      }

      if (qrResponse.ok) {
        const qrData = await qrResponse.json()
        setQrCodes(qrData.qrCodes || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const submitData = new FormData()
      submitData.append('name', formData.name)
      submitData.append('slug', formData.slug)
      submitData.append('google_review_url', formData.google_review_url)
      submitData.append('threshold_positive', formData.threshold_positive.toString())
      submitData.append('notification_email', formData.notification_email)
      submitData.append('logo_url', formData.logo_url)
      
      const response = await fetch("/api/business", {
        method: "POST",
        body: submitData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de la sauvegarde")
      }

      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Paramètres entreprise</h1>
        {business && (
          <Badge variant="outline">
            Plan : {qrCodes.length <= 5 ? 'Pro' : 'Agence'}
          </Badge>
        )}
      </div>

      {/* Business Information */}
      <Card className="border-0 shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl">Informations de l'entreprise</CardTitle>
          <CardDescription className="text-slate-600">
            Mettez à jour les détails de votre entreprise et votre branding
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nom de l'entreprise
                </label>
                <Input 
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Votre entreprise"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Slug (URL)
                </label>
                <Input 
                  name="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="votre-entreprise"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  trustreview.fr/votre-entreprise
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  URL Google Reviews
                </label>
                <Input 
                  name="google_review_url"
                  value={formData.google_review_url}
                  onChange={(e) => setFormData({ ...formData, google_review_url: e.target.value })}
                  placeholder="https://search.google.com/local/writereview?placeid=ChIJ..."
                />
                <p className="text-sm text-slate-500 mt-1">
                  Obtenez ce lien depuis votre profil Google Business
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email de notification
                </label>
                <Input 
                  name="notification_email"
                  type="email"
                  value={formData.notification_email}
                  onChange={(e) => setFormData({ ...formData, notification_email: e.target.value })}
                  placeholder="notifications@votre-entreprise.fr"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Recevez un email pour chaque nouvel avis
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Seuil de note positive
                </label>
                <Input 
                  name="threshold_positive"
                  type="number"
                  min="1"
                  max="5"
                  value={formData.threshold_positive}
                  onChange={(e) => setFormData({ ...formData, threshold_positive: parseInt(e.target.value) })}
                />
                <p className="text-sm text-slate-500 mt-1">
                  Les notes supérieures ou égales à ce seuil seront redirigées vers Google
                </p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Logo de l'entreprise</h3>
              <LogoUpload 
                currentLogo={business?.logo_url}
                onLogoChange={(logoUrl) => {
                  // Update form data when logo changes
                  setFormData(prev => ({ ...prev, logo_url: logoUrl }))
                }}
              />
            </div>

            <div className="border-t pt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900">Personnalisation des QR codes</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      La personnalisation des couleurs, textes et options des QR codes se fait maintenant dans la page 
                      <a href="/app/qr" className="underline font-medium">QR Codes</a>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
                        
            <Button type="submit" className="w-full md:w-auto" disabled={saving}>
              {saving ? "Sauvegarde..." : (business ? "Mettre à jour l'entreprise" : "Créer l'entreprise")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* QR Codes Management - Simplified */}
      {business && (
        <Card className="border-0 shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl">Gestion des QR codes</CardTitle>
            <CardDescription className="text-slate-600">
              Accédez à la gestion complète de vos QR codes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">QR Codes</h4>
                <p className="text-sm text-slate-500">
                  {qrCodes.length} QR code{qrCodes.length > 1 ? 's' : ''} créé{qrCodes.length > 1 ? 's' : ''}
                </p>
              </div>
              <Button onClick={() => window.location.href = '/app/qr'}>
                Gérer les QR codes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tutorial */}
      <Card className="border-0 shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl">Comment obtenir votre lien Google Reviews</CardTitle>
          <CardDescription className="text-slate-600">
            Suivez ces étapes pour obtenir votre URL Google Business
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="font-bold text-blue-600">1.</span>
              <div>
                <p className="font-medium">Allez sur Google Maps</p>
                <p className="text-slate-600">Recherchez votre entreprise sur Google Maps</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-blue-600">2.</span>
              <div>
                <p className="font-medium">Cliquez sur votre entreprise</p>
                <p className="text-slate-600">Sélectionnez votre entreprise dans les résultats</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-blue-600">3.</span>
              <div>
                <p className="font-medium">Cliquez sur "Écrire un avis"</p>
                <p className="text-slate-600">Cherchez le bouton d'avis et cliquez dessus</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-blue-600">4.</span>
              <div>
                <p className="font-medium">Copiez l'URL</p>
                <p className="text-slate-600">Copiez l'URL depuis la barre d'adresse de votre navigateur</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-blue-600">5.</span>
              <div>
                <p className="font-medium">Collez-la ci-dessus</p>
                <p className="text-slate-600">Collez l'URL dans le champ URL Google Reviews</p>
              </div>
            </li>
          </ol>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-blue-900">
              💡 Astuce : Votre URL devrait ressembler à :
            </p>
            <p className="text-xs text-blue-700 mt-1 font-mono break-all">
              https://search.google.com/local/writereview?placeid=ChIJ...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
