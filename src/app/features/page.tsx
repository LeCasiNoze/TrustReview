import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
  title: "Fonctionnalités TrustReview - QR codes intelligents et gestion d'avis",
  description: "QR codes multiples, page de note simple, redirection Google, feedback privé, dashboard statistiques, export CSV.",
}

export default function Features() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-blue-600">TrustReview</Link>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/features" className="text-slate-900 font-medium">Fonctionnalités</Link>
              <Link href="/pricing" className="text-slate-600 hover:text-slate-900 transition-colors">Tarifs</Link>
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
            Toutes les fonctionnalités pour gérer vos avis
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            QR codes intelligents, feedback privé, statistiques avancées
          </p>
          <Link href="/login">
            <Button size="lg" className="text-lg px-8 py-3 bg-blue-600 hover:bg-blue-700">
              Commencer maintenant
            </Button>
          </Link>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-16">
            Fonctionnalités principales
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-xl rounded-2xl h-full">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📱</span>
                </div>
                <CardTitle className="text-xl">QR codes multiples</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-slate-600">
                  <li>• QR codes par emplacement (entrée, tables, caisse)</li>
                  <li>• Personnalisables avec votre logo</li>
                  <li>• Téléchargeables en PNG</li>
                  <li>• Suivi des scans</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl rounded-2xl h-full">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">⭐</span>
                </div>
                <CardTitle className="text-xl">Page de note simple</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-slate-600">
                  <li>• Interface 5 étoiles intuitive</li>
                  <li>• Mobile-first</li>
                  <li>• Pas de login requis</li>
                  <li>• Temps de notation : 10 secondes</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl rounded-2xl h-full">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">�</span>
                </div>
                <CardTitle className="text-xl">Redirection vers Google</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-slate-600">
                  <li>• 4-5 étoiles → page Google Reviews</li>
                  <li>• 1-3 étoiles → feedback privé</li>
                  <li>• URL Google personnalisable</li>
                  <li>• Conforme aux règles Google</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl rounded-2xl h-full">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">�</span>
                </div>
                <CardTitle className="text-xl">Feedback privé</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-slate-600">
                  <li>• Collecte des avis négatifs en privé</li>
                  <li>• Formulaire de feedback détaillé</li>
                  <li>• Notifications instantanées</li>
                  <li>• Gérez les insatisfactions</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl rounded-2xl h-full">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <CardTitle className="text-xl">Dashboard statistiques</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-slate-600">
                  <li>• Note moyenne en temps réel</li>
                  <li>• Volume d'avis par période</li>
                  <li>• Taux de satisfaction</li>
                  <li>• Filtres avancés</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl rounded-2xl h-full">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">⚙️</span>
                </div>
                <CardTitle className="text-xl">Activation/désactivation QR</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-slate-600">
                  <li>• Activez/désactivez les QR codes</li>
                  <li>• Gérez plusieurs établissements</li>
                  <li>• Contrôle total sur la collecte</li>
                  <li>• Mises à jour en temps réel</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-16">
            Fonctionnalités avancées
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-4">
                Export CSV
              </h3>
              <p className="text-slate-600 mb-4">
                Exportez toutes vos données pour des analyses personnalisées.
              </p>
              <ul className="space-y-2 text-slate-600">
                <li>• Export des avis et feedbacks</li>
                <li>• Données brutes pour Excel</li>
                <li>• Rapports personnalisables</li>
                <li>• Planification d'exports</li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-4">
                Téléchargement PNG
              </h3>
              <p className="text-slate-600 mb-4">
                Téléchargez vos QR codes en haute qualité pour l'impression.
              </p>
              <ul className="space-y-2 text-slate-600">
                <li>• Format PNG haute résolution</li>
                <li>• Plusieurs tailles disponibles</li>
                <li>• Prêt pour l'impression</li>
                <li>• Versions avec/sans logo</li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-4">
                Notifications email
              </h3>
              <p className="text-slate-600 mb-4">
                Soyez alerté dès qu'un client laisse un avis.
              </p>
              <ul className="space-y-2 text-slate-600">
                <li>• Notifications instantanées</li>
                <li>• Résumés hebdomadaires</li>
                <li>• Filtres par type d'avis</li>
                <li>• Alertes critiques</li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-4">
                Support prioritaire
              </h3>
              <p className="text-slate-600 mb-4">
                Bénéficiez d'un support dédié pour vous accompagner.
              </p>
              <ul className="space-y-2 text-slate-600">
                <li>• Support par email</li>
                <li>• Réponse sous 24h</li>
                <li>• Documentation complète</li>
                <li>• Guides et tutoriels</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à transformer votre gestion d'avis ?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Commencez à collecter plus d'avis Google dès aujourd'hui
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
