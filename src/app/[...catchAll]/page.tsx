"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { Suspense } from "react";

function CatchAllPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  useEffect(() => {
    async function handleCodeExchange() {
      if (code) {
        try {
          const supabase = createSupabaseBrowser();
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (!error) {
            // Rediriger vers le callback approprié
            router.push("/auth/callback?" + searchParams.toString());
          } else {
            router.push(`/auth/error?error=${error.message}`);
          }
        } catch (err) {
          console.error("Error exchanging code:", err);
          router.push("/auth/error");
        }
      } else if (error) {
        router.push(`/auth/error?error=${error}&error_description=${errorDescription}`);
      } else {
        // Pas de code ni d'erreur, rediriger vers login
        router.push("/login");
      }
    }

    handleCodeExchange();
  }, [code, error, errorDescription, searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Connexion en cours...</p>
        {error && (
          <p className="text-red-600 mt-2">
            Erreur: {errorDescription || error}
          </p>
        )}
      </div>
    </div>
  );
}

export default function CatchAllPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <CatchAllPageContent />
    </Suspense>
  )
}
