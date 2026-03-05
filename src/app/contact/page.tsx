import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export const metadata = {
  title: "Contact TrustReview - Support et renseignements",
  description: "Contactez notre équipe pour toute question sur TrustReview. Support par email, formulaire de contact et assistance professionnelle.",
}

export default function Contact() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-blue-600">TrustReview</Link>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/features" className="text-slate-600 hover:text-slate-900 transition-colors">Fonctionnalités</Link>
              <Link href="/pricing" className="text-slate-600 hover:text-slate-900 transition-colors">Tarifs</Link>
              <Link href="/contact" className="text-slate-900 font-medium">Contact</Link>
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
            Contactez-nous
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Des questions ? Notre équipe est là pour vous aider. Envoyez-nous un message et nous répondrons dans les plus brefs délais.
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="border-0 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl">Envoyez-nous un message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nom
                    </label>
                    <Input placeholder="Jean" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Prénom
                    </label>
                    <Input placeholder="Dupont" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>
                  <Input type="email" placeholder="jean@exemple.com" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Entreprise
                  </label>
                  <Input placeholder="Restaurant Le Bon Goût" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Sujet
                  </label>
                  <Input placeholder="Comment pouvons-nous aider ?" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Message
                  </label>
                  <Textarea 
                    placeholder="Décrivez vos besoins..."
                    rows={4}
                  />
                </div>
                
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Envoyer le message
                </Button>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              <Card className="border-0 shadow-xl rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <span className="text-2xl">📧</span>
                    Email
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium text-slate-900">Support général</p>
                    <p className="text-slate-600">contact@trustreview.com</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Support technique</p>
                    <p className="text-slate-600">support@trustreview.com</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Commercial</p>
                    <p className="text-slate-600">sales@trustreview.com</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <span className="text-2xl">�</span>
                    Téléphone
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium text-slate-900">Support France</p>
                    <p className="text-slate-600">+33 1 23 45 67 89</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Heures d'ouverture</p>
                    <p className="text-slate-600">Lundi - Vendredi : 9h - 18h</p>
                    <p className="text-slate-600">Samedi - Dimanche : Fermé</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <span className="text-2xl">📍</span>
                    Adresse
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium text-slate-900">Siège social</p>
                    <p className="text-slate-600">123 Avenue des Affaires</p>
                    <p className="text-slate-600">75001 Paris</p>
                    <p className="text-slate-600">France</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-16">
            Questions fréquentes
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-0 shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg">Combien de temps pour répondre ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Nous répondons à toutes les demandes dans les 24 heures ouvrées. Pour les urgences, nous visons une réponse sous 4 heures.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg">Proposez-vous une démo ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Absolument ! Nous proposons des démos personnalisées pour les entreprises intéressées par nos plans Pro et Agence.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg">Y a-t-il un support technique ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Oui, nous fournissons un support technique complet pour tous nos clients. Les clients Agence bénéficient d'un support dédié.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg">Comment puis-je commencer ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  C'est simple ! Créez votre compte, configurez votre établissement en quelques minutes et générez votre premier QR code.
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
