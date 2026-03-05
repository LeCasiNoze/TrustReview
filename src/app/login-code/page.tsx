"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginCodePage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const generateCode = async () => {
    if (!email) {
      setMessage("Veuillez entrer votre email");
      setIsError(true);
      return;
    }

    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch("/api/login-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la génération du code");
      }

      setGeneratedCode(data.code);
      setMessage(`Code généré : ${data.code}`);
      setIsError(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erreur inconnue");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!email || !code) {
      setMessage("Veuillez entrer email et code");
      setIsError(true);
      return;
    }

    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch("/api/login-code", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Code invalide");
      }

      setMessage("Connexion réussie ! Redirection...");
      setIsError(false);
      
      // Rediriger vers le callback
      setTimeout(() => {
        window.location.href = data.redirectTo;
      }, 1000);

    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Code invalide");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-blue-600">🔐 Connexion par Code</CardTitle>
          <p className="text-sm text-gray-600">
            Mode temporaire - Entrez votre email pour recevoir un code
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
            />
          </div>

          <Button
            onClick={generateCode}
            disabled={loading || !email}
            className="w-full"
          >
            {loading ? "Génération..." : "Générer un code"}
          </Button>

          {generatedCode && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-sm text-green-800 mb-2">Votre code de connexion :</p>
              <p className="text-2xl font-bold text-green-600">{generatedCode}</p>
              <p className="text-xs text-green-600 mt-2">
                Ce code expire dans 10 minutes
              </p>
            </div>
          )}

          {generatedCode && (
            <div>
              <label className="block text-sm font-medium mb-2">Entrez le code</label>
              <Input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
              />
            </div>
          )}

          {generatedCode && (
            <Button
              onClick={verifyCode}
              disabled={loading || !code}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Vérification..." : "Se connecter"}
            </Button>
          )}

          {message && (
            <div className={`text-center p-3 rounded-lg ${
              isError ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
            }`}>
              {message}
            </div>
          )}

          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => window.location.href = "/login"}
              className="w-full"
            >
              ← Retour au login normal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
