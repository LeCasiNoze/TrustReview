# 🌟 TrustReview - Plateforme de Collecte d'Avis

TrustReview est une plateforme SaaS moderne permettant aux entreprises de collecter et gérer leurs avis clients via des QR codes personnalisables.

## ✨ Fonctionnalités

### 🎯 Core Features
- **QR Codes Personnalisables** : Créez des QR codes avec vos couleurs et branding
- **Collecte d'Avis** : Interface simple pour les clients de laisser leur avis
- **Tableau de Bord** : Statistiques détaillées et suivi des performances
- **Multi-Entreprises** : Gérez plusieurs établissements (plans Pro+)

### 💳 Système d'Abonnement
- **🔥 Starter** : Gratuit - 7 jours essai, 2 QR codes, 1 entreprise
- **⭐ Pro** : 19€/mois ou 190€/an - 10 QR codes, 3 entreprises
- **🚀 Agence** : 49€/mois ou 490€/an - QR codes illimités, entreprises illimitées

### 🎨 Personnalisation
- **Présets de Couleurs** : Professionnels, Marque, Fun
- **Branding** : Logo et couleurs personnalisées
- **Templates** : QR codes simples ou complets avec texte

### 📧 Notifications
- **Emails Automatiques** : Nouveaux avis, résumés hebdomadaires
- **Alertes** : Seuils personnalisables pour les faibles notes
- **In-App** : Notifications en temps réel

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- Compte Supabase
- Compte Stripe (optionnel pour les paiements)

### Installation

1. **Cloner le projet**
```bash
git clone https://github.com/votre-username/trustreview.git
cd trustreview
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
```bash
cp .env.example .env.local
```

4. **Configurer Supabase**
   - Créer un projet Supabase
   - Exécuter le script SQL `create_subscription_tables.sql`
   - Configurer les variables d'environnement

5. **Démarrer le développement**
```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📁 Structure du Projet

```
trustreview/
├── src/
│   ├── app/                 # Pages Next.js 13+ App Router
│   │   ├── api/            # API routes
│   │   ├── app/            # Tableau de bord
│   │   ├── auth/           # Authentification
│   │   └── r/              # Pages publiques QR codes
│   ├── components/         # Composants React
│   │   ├── ui/            # Composants UI de base
│   │   ├── layout/        # Layout components
│   │   ├── subscription/  # Abonnement
│   │   └── business/      # Multi-entreprises
│   └── lib/               # Utilitaires et logique
├── public/                # Static assets
└── docs/                  # Documentation
```

## 🔧 Configuration

### Variables d'Environnement

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anonyme
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service

# Stripe (optionnel)
STRIPE_SECRET_KEY=sk_test_votre_cle
STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle
STRIPE_WEBHOOK_SECRET=votre_webhook_secret

# Email (Resend)
RESEND_API_KEY=votre_cle_resend
RESEND_FROM_EMAIL=votre_email_verifie
```

### Configuration Stripe

1. Créez les produits dans votre dashboard Stripe
2. Configurez les webhooks vers `/api/stripe/webhook`
3. Mettez à jour les IDs des prix dans le code

## 🌐 Déploiement

### Vercel (Recommandé)

1. **Connecter GitHub**
   - Allez sur [Vercel](https://vercel.com)
   - Importez votre repository GitHub

2. **Configurer les variables**
   - Ajoutez toutes les variables d'environnement
   - Configurez le domaine personnalisé si besoin

3. **Déployer**
   - Vercel déploie automatiquement à chaque push
   - Le premier déploiement peut prendre quelques minutes

### Autres plateformes

Le projet fonctionne aussi sur :
- Netlify
- Railway
- DigitalOcean App Platform
- Tout hébergeur compatible Next.js

## 🧪 Tests

### Tests Locaux
```bash
npm run test          # Tests unitaires
npm run test:e2e      # Tests end-to-end
```

### Tests de Staging
- Chaque PR crée un environnement de staging automatiquement
- Tests d'intégration sur l'environnement de staging

## 📊 Architecture

### Frontend
- **Next.js 15** avec App Router
- **TypeScript** pour la sécurité des types
- **Tailwind CSS** pour le styling
- **Shadcn/ui** pour les composants

### Backend
- **Supabase** pour la base de données et authentification
- **Stripe** pour les paiements
- **Resend** pour les emails
- **Next.js API Routes** pour l'API

### Base de Données
- **PostgreSQL** via Supabase
- **RLS (Row Level Security)** pour la sécurité
- **Migrations** versionnées avec SQL

## 🤝 Contribuer

1. Fork le projet
2. Créer une branche (`git checkout -b feature/nouvelle-feature`)
3. Commiter vos changements (`git commit -am 'Ajouter nouvelle feature'`)
4. Pusher la branche (`git push origin feature/nouvelle-feature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🆘 Support

- **Documentation** : [docs/](docs/)
- **Issues** : [GitHub Issues](https://github.com/votre-username/trustreview/issues)
- **Email** : support@trustreview.fr

## 🎯 Roadmap

- [ ] Application mobile React Native
- [ ] Intégrations tierces (Google My Business, etc.)
- [ ] Analytics avancés avec ML
- [ ] API publique pour développeurs
- [ ] Marketplace de templates

---

**Built with ❤️ by TrustReview Team**
