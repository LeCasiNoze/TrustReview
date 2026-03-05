"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TempWelcomePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer l'email depuis la session temporaire
    const checkSession = async () => {
      try {
        const response = await fetch("/api/check-temp-session");
        if (response.ok) {
          const data = await response.json();
          setEmail(data.email || "");
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-4">
            🎉 Bienvenue sur TrustReview !
          </h1>
          <p className="text-xl text-gray-600">
            Votre connexion par code a réussi
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">
                ✅ Connexion réussie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-700 mb-4">
                Vous êtes connecté avec l'email : <strong>{email}</strong>
              </p>
              <p className="text-sm text-green-600">
                Session temporaire valide pendant 24 heures
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800">
                📋 Prochaines étapes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-blue-700">
                <li>• Configurez votre profil</li>
                <li>• Créez votre première entreprise</li>
                <li>• Générez vos premiers QR codes</li>
                <li>• Collectez des avis clients</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">
              ⚠️ Mode temporaire
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-yellow-700">
              Vous utilisez actuellement une connexion temporaire en attendant la résolution des problèmes d'emails.
            </p>
            <p className="text-sm text-yellow-600">
              Certaines fonctionnalités peuvent être limitées. Pour une expérience complète, 
              le système d'emails sera bientôt restauré.
            </p>
            <div className="flex gap-4">
              <Button 
                onClick={() => window.location.href = "/app/business"}
                className="bg-blue-600 hover:bg-blue-700"
              >
                🚀 Commencer
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = "/app/billing"}
              >
                💰 Voir l'abonnement
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Button 
            variant="ghost"
            onClick={() => window.location.href = "/login-code"}
            className="text-gray-600"
          >
            ← Changer de compte
          </Button>
        </div>
      </div>
    </div>
  );
}
