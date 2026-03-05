"use client";

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Suspense } from "react"

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-red-600">Erreur d'authentification</CardTitle>
          <CardDescription>
            Un problème est survenu lors de la connexion
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Le lien magique a peut-être expiré ou une erreur s'est produite lors du traitement de votre demande.
          </p>
          
          {(error || errorDescription) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-left">
              <p className="text-sm font-medium text-red-800">Détails de l'erreur :</p>
              <p className="text-sm text-red-600">{errorDescription || error}</p>
            </div>
          )}
          
          <div className="space-y-3">
            <Link href="/login">
              <Button className="w-full">
                Réessayer
              </Button>
            </Link>
            
            <Link href="/">
              <Button variant="outline" className="w-full">
                Retour à l'accueil
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
