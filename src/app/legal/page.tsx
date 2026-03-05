import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
  title: "Mentions légales et confidentialité - TrustReview",
  description: "Mentions légales et politique de confidentialité de TrustReview. Collecte des données, protection des informations, droits des utilisateurs.",
}

export default function Legal() {
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
            Mentions légales
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Documents légaux et politiques concernant les services TrustReview
          </p>
        </div>
      </section>

      {/* Legal Documents */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Terms of Service */}
          <Card className="border-0 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-2xl">Conditions générales d'utilisation</CardTitle>
              <p className="text-slate-600">
                Dernière mise à jour : 1 janvier 2024
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-4">1. Acceptation des conditions</h3>
                <p className="text-slate-600 mb-4">
                  En accédant et en utilisant TrustReview, vous acceptez d'être lié par les termes et dispositions de cet accord.
                </p>
                <p className="text-slate-600">
                  Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">2. Description du service</h3>
                <p className="text-slate-600 mb-4">
                  TrustReview est un service de collecte d'avis basé sur des QR codes qui aide les commerces à recueillir les feedbacks clients et à diriger les clients satisfaits vers Google Reviews.
                </p>
                <p className="text-slate-600">
                  Notre service inclut la génération de QR codes, des pages de notation, la collecte de feedbacks et des tableaux de bord analytiques.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">3. Comptes utilisateurs</h3>
                <p className="text-slate-600 mb-4">
                  Vous êtes responsable de la confidentialité de votre compte et mot de passe et de restreindre l'accès à votre ordinateur.
                </p>
                <p className="text-slate-600">
                  Vous acceptez d'être responsable de toutes les activités qui se produisent sous votre compte ou mot de passe.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">4. Paiement et abonnement</h3>
                <p className="text-slate-600 mb-4">
                  Les frais d'abonnement sont facturés d'avance sur une base mensuelle ou annuelle, selon votre plan choisi.
                </p>
                <p className="text-slate-600">
                  Tous les frais sont non remboursables sauf si requis par la loi ou spécifiquement indiqué dans notre politique de remboursement.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">5. Utilisations interdites</h3>
                <p className="text-slate-600 mb-4">
                  Vous ne pouvez pas utiliser notre service à des fins illégales ou non autorisées. Vous êtes interdit d'utiliser notre service pour :
                </p>
                <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                  <li>Violer les lois ou réglementations applicables</li>
                  <li>Enfreindre les droits de propriété intellectuelle</li>
                  <li>Harceler, abuser ou nuire à autrui</li>
                  <li>Envoyer des spams ou communications non sollicitées</li>
                  <li>Tenter d'accéder à nos systèmes sans autorisation</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">6. Disponibilité du service</h3>
                <p className="text-slate-600 mb-4">
                  Nous nous efforçons de maintenir une haute disponibilité du service mais ne pouvons garantir 100% de temps d'activité.
                </p>
                <p className="text-slate-600">
                  Nous pouvons suspendre temporairement le service pour maintenance, mises à jour ou autres raisons opérationnelles.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">7. Limitation de responsabilité</h3>
                <p className="text-slate-600 mb-4">
                  TrustReview, ses dirigeants, employés, partenaires ou fournisseurs ne pourront être tenus responsables des dommages indirects, accessoires, spéciaux ou consécutifs.
                </p>
                <p className="text-slate-600">
                  Notre responsabilité totale envers vous ne dépassera pas le montant que vous nous avez payé au cours des 12 derniers mois.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">8. Résiliation</h3>
                <p className="text-slate-600 mb-4">
                  Nous pouvons résilier ou suspendre votre compte immédiatement si vous violez ces conditions.
                </p>
                <p className="text-slate-600">
                  Vous pouvez résilier votre compte à tout moment via vos paramètres ou en contactant notre support.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Policy */}
          <Card className="border-0 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-2xl">Politique de confidentialité</CardTitle>
              <p className="text-slate-600">
                Dernière mise à jour : 1 janvier 2024
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-4">1. Informations que nous collectons</h3>
                <p className="text-slate-600 mb-4">
                  Nous collectons les informations que vous nous fournissez directement, comme lorsque vous créez un compte, utilisez nos services ou nous contactez pour du support.
                </p>
                <p className="text-slate-600">
                  Cela peut inclure votre nom, adresse email, informations d'entreprise et coordonnées de paiement.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">2. Comment nous utilisons vos informations</h3>
                <p className="text-slate-600 mb-4">
                  Nous utilisons les informations collectées pour fournir, maintenir et améliorer nos services.
                </p>
                <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                  <li>Traiter les transactions et envoyer les informations associées</li>
                  <li>Envoyer des notifications techniques et messages de support</li>
                  <li>Communiquer sur les produits, services et promotions</li>
                  <li>Surveiller et analyser les tendances et l'utilisation</li>
                  <li>Détecter, investiguer et prévenir les incidents de sécurité</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">3. Sécurité des données</h3>
                <p className="text-slate-600 mb-4">
                  Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre l'accès non autorisé, la modification, la divulgation ou la destruction.
                </p>
                <p className="text-slate-600">
                  Toutes les transmissions de données sont sécurisées avec le chiffrement SSL.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">4. Conservation des données</h3>
                <p className="text-slate-600 mb-4">
                  Nous conservons vos données personnelles aussi longtemps que nécessaire pour remplir les objectifs décrits dans cette politique.
                </p>
                <p className="text-slate-600">
                  Après résiliation du compte, nous supprimons ou anonymisons vos données personnelles dans les 30 jours.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">5. Vos droits</h3>
                <p className="text-slate-600 mb-4">
                  Vous avez le droit d'accéder, mettre à jour ou supprimer vos informations personnelles à tout moment via vos paramètres de compte.
                </p>
                <p className="text-slate-600">
                  Vous pouvez également demander une copie de vos données ou vous opposer à certaines activités de traitement.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">6. Services tiers</h3>
                <p className="text-slate-600 mb-4">
                  Notre service peut s'intégrer à des plateformes tierces comme Google pour la collecte d'avis.
                </p>
                <p className="text-slate-600">
                  Veuillez consulter les politiques de confidentialité de ces services tiers pour plus d'informations.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">7. Confidentialité des enfants</h3>
                <p className="text-slate-600 mb-4">
                  Notre service n'est pas destiné aux enfants de moins de 13 ans.
                </p>
                <p className="text-slate-600">
                  Nous ne collectons pas sciemment d'informations personnelles d'enfants de moins de 13 ans.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">8. Modifications de cette politique</h3>
                <p className="text-slate-600 mb-4">
                  Nous pouvons mettre à jour cette politique de confidentialité pour refléter les changements dans nos pratiques ou la loi applicable.
                </p>
                <p className="text-slate-600">
                  Nous vous notifierons des changements importants en publiant la nouvelle politique sur cette page.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="border-0 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-2xl">Contactez-nous</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">
                Si vous avez des questions sur ces documents légaux, veuillez nous contacter :
              </p>
              <div className="space-y-2">
                <p className="text-slate-600">
                  <strong>Email :</strong> legal@trustreview.com
                </p>
                <p className="text-slate-600">
                  <strong>Téléphone :</strong> +33 1 23 45 67 89
                </p>
                <p className="text-slate-600">
                  <strong>Adresse :</strong> 123 Avenue des Affaires, 75001 Paris, France
                </p>
              </div>
            </CardContent>
          </Card>
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
