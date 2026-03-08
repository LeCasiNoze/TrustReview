"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import QRCode from "qrcode";
import { QRColorPreset } from "@/lib/types/subscription";
import { getPublicUrlForPath } from "@/lib/utils";
import { getQuotaLimitMessage } from "@/lib/quotas";

interface QRCode {
  id: string;
  name: string;
  location: string;
  is_active: boolean;
  scan_count: number;
  created_at: string;
  custom_settings?: string;
}

interface Business {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  qr_background_color?: string;
  qr_foreground_color?: string;
  qr_text?: string;
}

export default function QRPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedQR, setSelectedQR] = useState<QRCode | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previewModes, setPreviewModes] = useState<Record<string, boolean>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [editingQR, setEditingQR] = useState<QRCode | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [colorPresets, setColorPresets] = useState<QRColorPreset[]>([]);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    location: "",
    is_active: true,
    background_color: "#ffffff",
    foreground_color: "#000000",
    text: "Scannez pour donner votre avis",
    include_logo: false
  });
  const [newQR, setNewQR] = useState({
    location: "",
    is_active: true,
    background_color: "#ffffff",
    foreground_color: "#000000",
    text: "Merci pour votre confiance ! 🙏",
    include_logo: false,
    fullPreview: true
  });

  useEffect(() => {
    fetchData();
    loadSubscriptionData();
    // Load preview modes from localStorage (client-side only)
    if (typeof window !== 'undefined') {
      const savedPreviewModes = localStorage.getItem('qrPreviewModes');
      if (savedPreviewModes) {
        try {
          setPreviewModes(JSON.parse(savedPreviewModes));
        } catch (e) {
          console.error('Error loading preview modes:', e);
        }
      }
    }
  }, []);

  const loadSubscriptionData = async () => {
    try {
      const [subscriptionResponse, presetsResponse] = await Promise.all([
        fetch("/api/subscription-info"), // ← UTILISER LA SOURCE DE VÉRITÉ
        fetch("/api/qr-color-presets")
      ]);

      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        console.log("🔍 [QR-FRONT-DEBUG] Subscription data loaded:", {
          canCreateQR: subscriptionData.canCreateQR,
          remainingQRCodes: subscriptionData.remainingQRCodes,
          plan: subscriptionData.plan?.slug,
          planName: subscriptionData.plan?.name
        });
        setSubscriptionInfo(subscriptionData);
      } else {
        console.error("🔍 [QR-FRONT-DEBUG] Subscription API failed:", subscriptionResponse.status);
      }

      if (presetsResponse.ok) {
        const presetsData = await presetsResponse.json();
        setColorPresets(presetsData.presets);
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
    }
  };

  // Generate previews for all QR codes when data loads
  useEffect(() => {
    if (qrCodes.length > 0 && business) {
      generateAllPreviews();
    }
  }, [qrCodes, business, previewModes]);

  // Save preview modes to localStorage when they change (client-side only)
  useEffect(() => {
    if (Object.keys(previewModes).length > 0 && typeof window !== 'undefined') {
      localStorage.setItem('qrPreviewModes', JSON.stringify(previewModes));
    }
  }, [previewModes]);

  const generateAllPreviews = async () => {
    if (!business) return;
    
    const urls: Record<string, string> = {};
    
    for (const qr of qrCodes) {
      try {
        const preview = await generatePreviewForQR(qr, previewModes[qr.id] || false);
        urls[qr.id] = preview;
      } catch (error) {
        console.error(`Error generating preview for QR ${qr.id}:`, error);
      }
    }
    
    setPreviewUrls(urls);
    
    // Set first QR as selected
    if (qrCodes.length > 0) {
      const firstQR = qrCodes[0];
      setSelectedQR(firstQR);
      setPreviewUrl(urls[firstQR.id] || '');
    }
  };

  const applyColorPreset = (preset: QRColorPreset) => {
    if (preset.is_premium && (!subscriptionInfo?.plan || subscriptionInfo.plan.slug === 'starter')) {
      // Afficher un message d'upgrade
      alert('Cette couleur est réservée aux abonnés Pro et Agence !');
      return;
    }

    setNewQR(prev => ({
      ...prev,
      background_color: preset.background_color,
      foreground_color: preset.foreground_color
    }));
  };

  const generatePreviewForQR = async (qr: QRCode, fullPreview: boolean = false): Promise<string> => {
    if (!business) return '';
    
    // Parse custom_settings
    let settings = {};
    if (qr.custom_settings) {
      try {
        settings = JSON.parse(qr.custom_settings);
      } catch (e) {
        console.error('Error parsing custom_settings:', e);
      }
    }
    
    const backgroundColor = (settings as any).background_color || "#ffffff";
    const foregroundColor = (settings as any).foreground_color || "#000000";
    const includeLogo = (settings as any).include_logo || false;
    const customText = (settings as any).text || "";
    
    if (fullPreview) {
      // Create complete preview with text and logo
      const canvasWidth = 300;
      const canvasHeight = includeLogo ? 400 : 350;
      const qrSize = 200;
      const qrX = (canvasWidth - qrSize) / 2;
      const qrY = includeLogo ? 100 : 50;
      
      let svgContent = `
        <svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="${backgroundColor}"/>
      `;
      
      // Add logo if enabled
      if (includeLogo && business.logo_url) {
        try {
          const logoResponse = await fetch(business.logo_url);
          if (logoResponse.ok) {
            const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());
            const logoSize = 50;
            const logoX = (canvasWidth - logoSize) / 2;
            const logoY = 10;
            
            const logoBase64 = logoBuffer.toString('base64');
            svgContent += `
              <image x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" 
                     href="data:image/png;base64,${logoBase64}"/>
            `;
          }
        } catch (logoError) {
          console.error('Failed to fetch logo for preview:', logoError);
        }
      }
      
      // Add top invitation text
      svgContent += `
        <text x="50%" y="${includeLogo ? 70 : 30}" font-family="Arial, sans-serif" 
              font-size="14" font-weight="bold" text-anchor="middle" fill="${foregroundColor}">
          ⭐ Votre avis compte ! ⭐
        </text>
        <text x="50%" y="${includeLogo ? 88 : 48}" font-family="Arial, sans-serif" 
              font-size="11" text-anchor="middle" fill="${foregroundColor}">
          Aidez-nous à nous améliorer
        </text>
      `;
      
      // Add QR code
      const qrData = await QRCode.toDataURL(getPublicUrlForPath(`/r/${business.slug}`), {
        color: {
          dark: foregroundColor,
          light: backgroundColor
        },
        width: qrSize
      });
      
      const qrBase64 = qrData.split(',')[1];
      svgContent += `
        <image x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" 
               href="data:image/png;base64,${qrBase64}"/>
      `;
      
      // Add bottom thank you text
      const bottomText = customText || "Merci pour votre confiance ! 🙏";
      svgContent += `
        <text x="50%" y="${qrY + qrSize + 25}" font-family="Arial, sans-serif" 
              font-size="12" font-weight="bold" text-anchor="middle" fill="${foregroundColor}">
          ${bottomText}
        </text>
        <text x="50%" y="${qrY + qrSize + 42}" font-family="Arial, sans-serif" 
              font-size="10" text-anchor="middle" fill="${foregroundColor}">
          Scannez pour donner votre avis
        </text>
      `;
      
      svgContent += '</svg>';
      
      // Convert SVG to data URL
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
      return URL.createObjectURL(svgBlob);
    } else {
      // Simple QR code only
      const qrData = await QRCode.toDataURL(getPublicUrlForPath(`/r/${business.slug}`), {
        color: {
          dark: foregroundColor,
          light: backgroundColor
        }
      });
      return qrData;
    }
  };

  const fetchData = async () => {
    try {
      const [businessResponse, qrResponse] = await Promise.all([
        fetch("/api/business/current"),
        fetch("/api/qr-codes")
      ]);

      if (!businessResponse.ok) {
        throw new Error("Entreprise non trouvée");
      }

      const businessData = await businessResponse.json();
      setBusiness(businessData);

      if (qrResponse.ok) {
        const qrData = await qrResponse.json();
        setQrCodes(qrData.qrCodes || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  
  const createQRCode = async () => {
    if (!business || !newQR.location.trim()) return;

    // DEBUG: État des variables de blocage
    console.log("🔍 [QR-FRONT-DEBUG] Create QR attempt:", {
      hasBusiness: !!business,
      hasLocation: newQR.location.trim().length > 0,
      hasSubscriptionInfo: !!subscriptionInfo,
      canCreateQR: subscriptionInfo?.canCreateQR,
      remainingQRCodes: subscriptionInfo?.remainingQRCodes,
      planSlug: subscriptionInfo?.plan?.slug,
      planName: subscriptionInfo?.plan?.name
    });

    // Vérifier les limites d'abonnement avec message robuste
    if (!subscriptionInfo?.canCreateQR) {
      console.log("🔍 [QR-FRONT-DEBUG] blocking create before POST - canCreateQR = false");
      const message = getQuotaLimitMessage('create_qr', subscriptionInfo.plan?.slug, subscriptionInfo.remainingQRCodes);
      alert(message || "Vous ne pouvez pas créer de QR code avec votre plan actuel.");
      return;
    }

    // Vérifier si l'abonnement est actif (utiliser la même source de vérité)
    const subscriptionResponse = await fetch('/api/subscription-info');
    const subscriptionData = await subscriptionResponse.json();
    
    if (!subscriptionData.canAccess || subscriptionData.subscriptionStatus === 'canceled' || subscriptionData.subscriptionStatus === 'past_due') {
      console.log("🔍 [QR-FRONT-DEBUG] blocking create - subscription inactive");
      alert('Votre abonnement a expiré. Renouvelez-le pour continuer à créer des QR codes.');
      window.location.href = '/app/billing';
      return;
    }

    console.log("🔍 [QR-FRONT-DEBUG] sending POST /api/qr-codes");

    try {
      // Generate automatic name: QR_X_Emplacement
      const qrNumber = qrCodes.length + 1;
      const autoName = `QR_${qrNumber}_${newQR.location.replace(/[^a-zA-Z0-9]/g, '_')}`;

      const formData = new FormData();
      formData.append('name', autoName);
      formData.append('location', newQR.location);
      formData.append('is_active', newQR.is_active.toString());
      formData.append('background_color', newQR.background_color);
      formData.append('foreground_color', newQR.foreground_color);
      formData.append('text', newQR.text);
      formData.append('include_logo', newQR.include_logo.toString());

      const response = await fetch("/api/qr-codes", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la création");
      }

      await fetchData();
      setShowCreateForm(false);
      setNewQR({
        location: "",
        is_active: true,
        background_color: "#ffffff",
        foreground_color: "#000000",
        text: "Scannez pour donner votre avis",
        include_logo: false,
        fullPreview: true
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de création");
    }
  };

  const downloadQRCode = async (qrId: string, name: string) => {
    try {
      const response = await fetch(`/api/qr-codes/${qrId}/download`);
      if (!response.ok) {
        throw new Error("Erreur lors du téléchargement");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trustreview-${name}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de téléchargement");
    }
  };

  const generatePreview = async (qr: QRCode, fullPreview: boolean = false) => {
    if (!business) return;
    
    // Parse custom_settings
    let settings = {};
    if (qr.custom_settings) {
      try {
        settings = JSON.parse(qr.custom_settings);
      } catch (e) {
        console.error('Error parsing custom_settings:', e);
      }
    }
    
    const backgroundColor = (settings as any).background_color || "#ffffff";
    const foregroundColor = (settings as any).foreground_color || "#000000";
    const includeLogo = (settings as any).include_logo || false;
    const customText = (settings as any).text || "";
    
    if (fullPreview) {
      // Create complete preview with text and logo
      const canvasWidth = 300;
      const canvasHeight = includeLogo ? 400 : 350;
      const qrSize = 200;
      const qrX = (canvasWidth - qrSize) / 2;
      const qrY = includeLogo ? 100 : 50;
      
      let svgContent = `
        <svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="${backgroundColor}"/>
      `;
      
      // Add logo if enabled
      if (includeLogo && business.logo_url) {
        try {
          const logoResponse = await fetch(business.logo_url);
          if (logoResponse.ok) {
            const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());
            const logoSize = 50;
            const logoX = (canvasWidth - logoSize) / 2;
            const logoY = 10;
            
            const logoBase64 = logoBuffer.toString('base64');
            svgContent += `
              <image x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" 
                     href="data:image/png;base64,${logoBase64}"/>
            `;
          }
        } catch (logoError) {
          console.error('Failed to fetch logo for preview:', logoError);
        }
      }
      
      // Add top invitation text
      svgContent += `
        <text x="50%" y="${includeLogo ? 70 : 30}" font-family="Arial, sans-serif" 
              font-size="14" font-weight="bold" text-anchor="middle" fill="${foregroundColor}">
          ⭐ Votre avis compte ! ⭐
        </text>
        <text x="50%" y="${includeLogo ? 88 : 48}" font-family="Arial, sans-serif" 
              font-size="11" text-anchor="middle" fill="${foregroundColor}">
          Aidez-nous à nous améliorer
        </text>
      `;
      
      // Add QR code
      const qrData = await QRCode.toDataURL(getPublicUrlForPath(`/r/${business.slug}`), {
        color: {
          dark: foregroundColor,
          light: backgroundColor
        },
        width: qrSize
      });
      
      const qrBase64 = qrData.split(',')[1];
      svgContent += `
        <image x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" 
               href="data:image/png;base64,${qrBase64}"/>
      `;
      
      // Add bottom thank you text
      const bottomText = customText || "Merci pour votre confiance ! 🙏";
      svgContent += `
        <text x="50%" y="${qrY + qrSize + 25}" font-family="Arial, sans-serif" 
              font-size="12" font-weight="bold" text-anchor="middle" fill="${foregroundColor}">
          ${bottomText}
        </text>
        <text x="50%" y="${qrY + qrSize + 42}" font-family="Arial, sans-serif" 
              font-size="10" text-anchor="middle" fill="${foregroundColor}">
          Scannez pour donner votre avis
        </text>
      `;
      
      svgContent += '</svg>';
      
      // Convert SVG to data URL
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
      const svgUrl = URL.createObjectURL(svgBlob);
      setPreviewUrl(svgUrl);
    } else {
      // Simple QR code only
      const qrData = await QRCode.toDataURL(getPublicUrlForPath(`/r/${business.slug}`), {
        color: {
          dark: foregroundColor,
          light: backgroundColor
        }
      });
      setPreviewUrl(qrData);
    }
  };

  const copyLink = (qr: QRCode) => {
    if (!business) return;
    const url = `${window.location.origin}/r/${business.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(qr.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const startEditQR = (qr: QRCode) => {
    // Parse custom_settings if it exists
    let settings = {};
    if (qr.custom_settings) {
      try {
        settings = JSON.parse(qr.custom_settings);
      } catch (e) {
        console.error('Error parsing custom_settings:', e);
      }
    }
    
    setEditingQR(qr);
    setEditForm({
      location: qr.location || "",
      is_active: qr.is_active,
      background_color: (settings as any).background_color || "#ffffff",
      foreground_color: (settings as any).foreground_color || "#000000",
      text: (settings as any).text || "Scannez pour donner votre avis",
      include_logo: (settings as any).include_logo || false
    });
  };

  const updateQRCode = async () => {
    if (!editingQR) return;

    try {
      const response = await fetch(`/api/qr-codes/${editingQR.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour");
      }

      await fetchData();
      setEditingQR(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de mise à jour");
    }
  };

  const deleteQRCode = async (qrId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce QR code ?")) return;

    try {
      const response = await fetch(`/api/qr-codes/${qrId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de suppression");
    }
  };

  const toggleQRCode = async (qrId: string, isActive: boolean) => {
    // TODO: Implement toggle API
    console.log("Toggle QR code:", qrId, isActive);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2" style={{ borderColor:"hsl(226 71% 55%)" }} />
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="card-enhanced p-5">
        <p className="text-sm font-semibold" style={{ color:"hsl(0 84% 55%)" }}>Erreur</p>
        <p className="text-xs text-muted-foreground mt-1">{error || "Aucune entreprise trouvée"}</p>
      </div>
    );
  }

  const qrLimit = subscriptionInfo?.plan?.max_qr_codes ?? null;
  const canCreate = subscriptionInfo?.canCreateQR ?? false;

  /* ─────────────────────────────────────────── */
  return (
    <div className="space-y-4 animate-fadein">

      {/* ── Page header ─────────────────────────── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">QR Codes</h1>
          <p className="page-desc">
            {qrCodes.length}/{qrLimit === null ? '∞' : qrLimit} codes · 
            <span className="font-medium" style={{ color:"hsl(226 71% 55%)" }}> {subscriptionInfo?.plan?.name || 'Chargement...'}</span> · 
            {subscriptionInfo?.plan?.slug !== 'starter' ? 'Personnalisation complète' : 'Personnalisation de base'}
          </p>
        </div>
        {canCreate && (
          <Button size="sm" onClick={() => setShowCreateForm(v => !v)}>
            <svg className="mr-1.5" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nouveau QR
          </Button>
        )}
      </div>

      {/* ── Create form panel ───────────────────── */}
      {showCreateForm && (
        <div className="form-panel animate-fadein-scale">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Nouveau QR code</p>
              <p className="text-xs text-muted-foreground mt-0.5">Le nom est généré automatiquement à partir de l&apos;emplacement</p>
            </div>
            <button onClick={() => setShowCreateForm(false)} className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <p className="field-label">Emplacement *</p>
              <Input
                value={newQR.location}
                onChange={(e) => setNewQR({ ...newQR, location: e.target.value })}
                placeholder="ex. Entrée principale, Table 1, Caisse…"
              />
            </div>

            <div className="sm:col-span-2">
              <p className="field-label">Présets de couleurs</p>
              <div className="space-y-3">
                {/* Présents par catégorie */}
                {['professionnel', 'marque', 'fun'].map(category => (
                  <div key={category}>
                    <p className="text-xs font-medium text-muted-foreground mb-2 capitalize">{category}</p>
                    <div className="flex flex-wrap gap-2">
                      {colorPresets
                        .filter(preset => preset.category === category)
                        .map(preset => (
                          <button
                            key={preset.id}
                            onClick={() => applyColorPreset(preset)}
                            disabled={preset.is_premium && (!subscriptionInfo?.plan || subscriptionInfo.plan.slug === 'starter')}
                            className={`group relative w-12 h-12 rounded-lg border-2 transition-all ${
                              preset.is_premium && (!subscriptionInfo?.plan || subscriptionInfo.plan.slug === 'starter')
                                ? 'opacity-50 cursor-not-allowed border-slate-200'
                                : 'border-slate-300 hover:border-primary cursor-pointer'
                            }`}
                            style={{
                              background: preset.background_color.includes('gradient') 
                                ? preset.background_color 
                                : preset.background_color
                            }}
                            title={preset.name + (preset.is_premium ? ' (Premium)' : '')}
                          >
                            <div 
                              className="absolute inset-1 rounded flex items-center justify-center"
                              style={{ 
                                backgroundColor: preset.foreground_color,
                                background: preset.foreground_color.includes('gradient') 
                                  ? preset.foreground_color 
                                  : preset.foreground_color
                              }}
                            >
                              <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
                            </div>
                            {preset.is_premium && (!subscriptionInfo?.plan || subscriptionInfo.plan.slug === 'starter') && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">🔒</span>
                              </div>
                            )}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="field-label">Couleur de fond</p>
              <div className="flex gap-2">
                <Input type="color" value={newQR.background_color}
                  onChange={(e) => setNewQR({ ...newQR, background_color: e.target.value })}
                  className="w-10 h-9 p-1 cursor-pointer" />
                <Input value={newQR.background_color}
                  onChange={(e) => setNewQR({ ...newQR, background_color: e.target.value })}
                  placeholder="#ffffff" className="font-mono text-xs" />
              </div>
            </div>

            <div>
              <p className="field-label">Couleur du QR</p>
              <div className="flex gap-2">
                <Input type="color" value={newQR.foreground_color}
                  onChange={(e) => setNewQR({ ...newQR, foreground_color: e.target.value })}
                  className="w-10 h-9 p-1 cursor-pointer" />
                <Input value={newQR.foreground_color}
                  onChange={(e) => setNewQR({ ...newQR, foreground_color: e.target.value })}
                  placeholder="#000000" className="font-mono text-xs" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <p className="field-label">Texte d&apos;invitation (optionnel)</p>
              <Input value={newQR.text}
                onChange={(e) => setNewQR({ ...newQR, text: e.target.value })}
                placeholder="Merci pour votre confiance !" maxLength={50} />
            </div>

            <div className="flex items-center gap-3">
              <Switch id="include-logo" checked={newQR.include_logo}
                onCheckedChange={(c: boolean) => setNewQR({ ...newQR, include_logo: c })} />
              <Label htmlFor="include-logo" className="text-xs font-medium cursor-pointer">Logo inclus</Label>
            </div>

            <div className="flex items-center gap-3">
              <Switch id="full-preview" checked={newQR.fullPreview}
                onCheckedChange={(c: boolean) => setNewQR({ ...newQR, fullPreview: c })} />
              <Label htmlFor="full-preview" className="text-xs font-medium cursor-pointer">Vue complète</Label>
            </div>
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t border-border">
            <Button size="sm" onClick={createQRCode} disabled={!newQR.location.trim()}>
              Créer le QR code
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowCreateForm(false)}>Annuler</Button>
          </div>
        </div>
      )}

      {/* ── QR list + side preview ──────────────── */}
      <div className="flex gap-4">

        {/* List */}
        <div className="card-enhanced flex-1 overflow-hidden">
          {qrCodes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/>
                  <rect x="3" y="16" width="5" height="5"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><line x1="21" y1="21" x2="21" y2="21"/>
                </svg>
              </div>
              <p className="empty-state-title">Aucun QR code</p>
              <p className="empty-state-desc">Créez votre premier QR code pour commencer à collecter des avis</p>
              <Button size="sm" className="mt-3" onClick={() => setShowCreateForm(true)}>
                Créer le premier QR
              </Button>
            </div>
          ) : (
            <div>
              {/* List header */}
              <div className="grid px-4 py-2.5 border-b border-border" style={{ gridTemplateColumns:"44px 1fr 80px 70px 120px", gap:"0.75rem", alignItems:"center" }}>
                <span />
                <p className="section-label" style={{ marginBottom:0 }}>Emplacement</p>
                <p className="section-label" style={{ marginBottom:0 }}>Statut</p>
                <p className="section-label" style={{ marginBottom:0 }}>Scans</p>
                <p className="section-label" style={{ marginBottom:0 }}>Actions</p>
              </div>

              {qrCodes.map((qr) => (
                <div key={qr.id}
                  className="list-row cursor-pointer"
                  style={selectedQR?.id === qr.id ? { background:"hsl(226 100% 97%)" } : {}}
                  onClick={() => { setSelectedQR(qr); setPreviewUrl(previewUrls[qr.id] || ''); }}
                >
                  {/* QR thumbnail */}
                  <div className="shrink-0 rounded-md overflow-hidden border border-border" style={{ width:44, height:44 }}>
                    {previewUrls[qr.id] ? (
                      <img src={previewUrls[qr.id]} alt={qr.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background:"hsl(220 14% 96%)" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(220 9% 70%)" strokeWidth="1.5"><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/></svg>
                      </div>
                    )}
                  </div>

                  {/* Name + location */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{qr.name}</p>
                    <div className="meta-row mt-0.5">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      <span className="truncate">{qr.location || "Non spécifié"}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="shrink-0">
                    <span className={qr.is_active ? "chip chip-teal" : "chip chip-slate"}>
                      {qr.is_active ? "Actif" : "Inactif"}
                    </span>
                  </div>

                  {/* Scan count */}
                  <div className="shrink-0 text-center">
                    <span className="text-sm font-bold text-foreground">{qr.scan_count || 0}</span>
                    <p className="text-xs" style={{ color:"hsl(220 9% 60%)", fontSize:"0.65rem" }}>scans</p>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    <button onClick={() => downloadQRCode(qr.id, qr.name)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-white text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                      title="Télécharger">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </button>
                    <button onClick={() => copyLink(qr)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-white transition-colors"
                      style={copiedId === qr.id ? { borderColor:"hsl(142 72% 40%)", color:"hsl(142 72% 35%)" } : {}}
                      title={copiedId === qr.id ? "Copié !" : "Copier le lien"}>
                      {copiedId === qr.id
                        ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      }
                    </button>
                    <button onClick={() => startEditQR(qr)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-white text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                      title="Modifier">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => deleteQRCode(qr.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-white text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                      title="Supprimer">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Side preview — desktop only */}
        {selectedQR && previewUrl && (
          <div className="card-enhanced p-4 hidden lg:flex flex-col items-center gap-3 shrink-0" style={{ width:200 }}>
            <p className="section-label w-full">Aperçu</p>
            <div className="rounded-xl border border-border bg-white p-3 w-full flex items-center justify-center">
              <img src={previewUrl} alt="QR preview" className="max-w-full" style={{ maxHeight:150 }} />
            </div>
            <div className="w-full">
              <p className="text-xs font-semibold text-foreground truncate">{selectedQR.name}</p>
              <div className="meta-row mt-0.5">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {selectedQR.location || "—"}
              </div>
              <p className="text-xs font-mono mt-2 truncate" style={{ color:"hsl(220 9% 55%)", fontSize:"0.65rem" }}>
                /r/{business.slug}
              </p>
            </div>
            <div className="flex gap-1.5 w-full">
              <Switch
                id="side-preview-mode"
                checked={previewModes[selectedQR.id] || false}
                onCheckedChange={async (c: boolean) => {
                  setPreviewModes(p => ({ ...p, [selectedQR.id]: c }));
                  const url = await generatePreviewForQR(selectedQR, c);
                  setPreviewUrls(p => ({ ...p, [selectedQR.id]: url }));
                  setPreviewUrl(url);
                }}
              />
              <Label htmlFor="side-preview-mode" className="text-xs cursor-pointer">
                {previewModes[selectedQR.id] ? "Complet" : "QR seul"}
              </Label>
            </div>
            <Button size="sm" className="w-full" onClick={() => downloadQRCode(selectedQR.id, selectedQR.name)}>
              <svg className="mr-1.5" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Télécharger
            </Button>
          </div>
        )}
      </div>

      {/* ── Tips section ────────────────────────── */}
      <div className="card-muted rounded-xl p-5">
        <p className="section-label">Bonnes pratiques</p>
        <div className="grid sm:grid-cols-2 gap-4 mt-1">
          {[
            { icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, title:"Emplacements recommandés", items:["Tables et menus","Devanture et vitrines","Reçus et emballages","Comptoir de caisse"] },
            { icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>, title:"Conseils d'utilisation", items:["Placer à hauteur des yeux","Appel à l'action lisible","Tester avant impression","Personnaliser avec votre logo"] },
          ].map(({ icon, title, items }) => (
            <div key={title}>
              <div className="flex items-center gap-2 mb-2" style={{ color:"hsl(220 9% 45%)" }}>
                {icon}
                <span className="text-xs font-semibold">{title}</span>
              </div>
              <ul className="space-y-1">
                {items.map(it => (
                  <li key={it} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="h-1 w-1 rounded-full shrink-0" style={{ background:"hsl(226 71% 65%)" }} />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Edit modal ──────────────────────────── */}
      {editingQR && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background:"rgba(10,14,30,0.55)", backdropFilter:"blur(4px)" }}>
          <div className="card-enhanced p-5 w-full max-w-md animate-fadein-scale">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="section-label">Modifier QR Code</p>
                <h2 className="text-sm font-semibold text-foreground">{editingQR.name}</h2>
              </div>
              <button onClick={() => setEditingQR(null)} className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="field-label">Emplacement</p>
                <Input value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="Entrée principale" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="field-label">Couleur de fond</p>
                  <div className="flex gap-2">
                    <Input type="color" value={editForm.background_color}
                      onChange={(e) => setEditForm({ ...editForm, background_color: e.target.value })}
                      className="w-10 h-9 p-1 cursor-pointer" />
                    <Input value={editForm.background_color}
                      onChange={(e) => setEditForm({ ...editForm, background_color: e.target.value })}
                      className="font-mono text-xs" placeholder="#ffffff" />
                  </div>
                </div>
                <div>
                  <p className="field-label">Couleur QR</p>
                  <div className="flex gap-2">
                    <Input type="color" value={editForm.foreground_color}
                      onChange={(e) => setEditForm({ ...editForm, foreground_color: e.target.value })}
                      className="w-10 h-9 p-1 cursor-pointer" />
                    <Input value={editForm.foreground_color}
                      onChange={(e) => setEditForm({ ...editForm, foreground_color: e.target.value })}
                      className="font-mono text-xs" placeholder="#000000" />
                  </div>
                </div>
              </div>

              <div>
                <p className="field-label">Texte d&apos;invitation</p>
                <Input value={editForm.text}
                  onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                  placeholder="Merci pour votre confiance !" maxLength={50} />
              </div>

              <div className="flex items-center gap-3 py-1">
                <Switch id="edit-active" checked={editForm.is_active}
                  onCheckedChange={(c: boolean) => setEditForm({ ...editForm, is_active: c })} />
                <Label htmlFor="edit-active" className="text-xs font-medium cursor-pointer">QR code actif</Label>
              </div>

              <div className="flex items-center gap-3 py-1">
                <Switch id="edit-include-logo" checked={editForm.include_logo}
                  onCheckedChange={(c: boolean) => setEditForm({ ...editForm, include_logo: c })} />
                <Label htmlFor="edit-include-logo" className="text-xs font-medium cursor-pointer">Inclure le logo</Label>
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
              <Button size="sm" onClick={updateQRCode} className="flex-1">Enregistrer</Button>
              <Button size="sm" variant="outline" onClick={() => setEditingQR(null)} className="flex-1">Annuler</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
