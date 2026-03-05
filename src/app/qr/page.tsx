"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";

export default function QRPage() {
  const [business, setBusiness] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchBusiness();
  }, []);

  const fetchBusiness = async () => {
    try {
      const response = await fetch("/api/business/current");
      if (!response.ok) {
        throw new Error("Business not found");
      }
      const data = await response.json();
      setBusiness(data);
      
      // Generate QR code with dynamic slug from Supabase
      let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    // En production, s'assurer que l'URL est correcte
    if (!baseUrl || baseUrl.includes('localhost')) {
      baseUrl = window.location.origin;
    }
      const qrUrl = `${baseUrl}/r/${data.slug}`;
      console.log("QR Code URL:", qrUrl); // Debug log
      
      const qrData = await QRCode.toDataURL(qrUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF"
        }
      });
      setQrDataUrl(qrData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load business");
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrDataUrl || !business) return;
    
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `qr-code-${business.slug}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Erreur
          </h1>
          <p className="text-gray-600">
            {error || "Aucune entreprise trouvée"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Votre QR Code
          </h1>
          <p className="text-gray-600 text-lg">
            Les clients peuvent scanner ce QR code pour laisser un avis.
          </p>
        </div>

        {/* Business Info */}
        <div className="text-center">
          <div className="inline-block bg-blue-50 rounded-full px-4 py-2">
            <p className="text-blue-800 font-medium">{business.name}</p>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex justify-center">
          {qrDataUrl && (
            <div className="bg-white p-4 rounded-xl border-2 border-gray-200">
              <img 
                src={qrDataUrl} 
                alt="QR Code" 
                className="w-64 h-64"
              />
            </div>
          )}
        </div>

        {/* URL Display */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">
            URL du QR code:
          </p>
          <p className="text-sm text-blue-600 font-mono bg-blue-50 rounded px-2 py-1">
            {typeof window !== 'undefined' ? window.location.origin : 'https://trustreview-eight.vercel.app'}/r/{business.slug}
          </p>
        </div>

        {/* Download Button */}
        <button
          onClick={downloadQR}
          className="w-full bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200"
        >
          Télécharger le QR Code (PNG)
        </button>

        {/* Instructions */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Imprimez ce QR code et affichez-le dans votre établissement
          </p>
        </div>
      </div>
    </div>
  );
}
