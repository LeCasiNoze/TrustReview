import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Tarifs TrustReview - Plans pour tous les commerces",
  description: "Plans Starter, Pro et Agence. Paiement mensuel, résiliable à tout moment. QR codes illimités, stats avancées, multi-établissements.",
}

export default function Pricing() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-blue-600">TrustReview</Link>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/features" className="text-slate-600 hover:text-slate-900 transition-colors">Fonctionnalités</Link>
              <Link href="/pricing" className="text-slate-900 font-medium">Tarifs</Link>
              <Link href="/contact" className="text-slate-600 hover:text-slate-900 transition-colors">Contact</Link>
              <Link href="/login">
                <Button variant="ghost" className="text-slate-600 hover:text-slate-900">Se connecter</Button>
              </Link>
              <Link href="/login">
                <Button className="bg-blue-600 hover:bg-blue-700">Commencer</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Plans simples pour tous les commerces
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Paiement mensuel, résiliable à tout moment
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Pro Plan */}
            <Card className="border-0 shadow-xl rounded-2xl relative overflow-hidden border-2 border-blue-500">
              <div className="absolute top-4 right-4">
                <Badge className="bg-blue-500 text-white">Essai gratuit 7 jours</Badge>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Pro</h3>
                <p className="text-slate-600 mb-6">Parfait pour les petites et moyennes entreprises</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900">19€</span>
                  <span className="text-slate-600">/mois</span>
                  <div className="text-sm text-green-600 mt-1">7 jours d'essai gratuit</div>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-slate-700">5 QR codes maximum</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-slate-700">QR codes personnalisés</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-slate-700">Collecte d'avis illimitée</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-slate-700">Notifications email</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-slate-700">Statistiques détaillées</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-slate-700">Support par email</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-slate-700">1 entreprise</span>
                  </li>
                </ul>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Essayer gratuitement
                </Button>
              </div>
            </Card>

            {/* Agency Plan */}
            <Card className="border-0 shadow-xl rounded-2xl relative overflow-hidden">
              <div className="p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Agence</h3>
                <p className="text-slate-600 mb-6">Pour les agences et grandes entreprises</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900">49€</span>
                  <span className="text-slate-600">/mois</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-slate-700">QR codes illimités</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-slate-700">QR codes personnalisés premium</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-slate-700">Collecte d'avis illimitée</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-slate-700">Notifications multi-canaux</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-slate-700">Statistiques avancées</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-slate-700">API d'intégration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-slate-700">Entreprises illimitées</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-slate-700">Support prioritaire</span>
                  </li>
                </ul>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Commencer
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-16">
            Questions fréquentes
          </h2>
          
          <div className="space-y-6">
            <Card className="border-0 shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg">Est-ce conforme aux règles Google ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Vous redirigez vers la page Google, le client choisit librement de laisser un avis ou non.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg">Combien de temps pour installer ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Quelques minutes. Créez votre compte, configurez votre établissement et générez votre premier QR code.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg">Puis-je avoir plusieurs QR codes ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Oui ! Le plan Pro permet des QR codes illimités pour différents emplacements (entrée, tables, caisse...).
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg">Que se passe-t-il pour les avis négatifs ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Les clients donnant 1-3 étoiles sont redirigés vers un formulaire de feedback privé pour vous aider à vous améliorer.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg">Puis-je résilier ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Oui, vous pouvez résilier votre abonnement à tout moment sans frais.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à commencer ?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Rejoignez les commerces qui améliorent leur réputation avec TrustReview
          </p>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3 bg-white text-blue-600 hover:bg-slate-50">
              Commencer maintenant
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">TrustReview</h3>
            <p className="text-slate-400">
              QR codes intelligents pour mieux gérer vos avis clients.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Produit</h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/features" className="hover:text-white transition-colors">Fonctionnalités</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Tarifs</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Entreprise</h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/legal" className="hover:text-white transition-colors">Mentions légales</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Compte</h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/login" className="hover:text-white transition-colors">Se connecter</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Commencer</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-slate-800 text-center text-slate-400">
          <p>&copy; 2024 TrustReview. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}
