"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import type { Stripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserSubscriptionInfo, SubscriptionPlan } from "@/lib/types/subscription";

// Plans statiques pour l'affichage (prix en centimes)
const STATIC_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Parfait pour démarrer',
    price_monthly: 1900, // 19€
    price_yearly: 19000, // 190€
    max_qr_codes: 5,
    max_businesses: 1,
    features: [
      'Essai gratuit 7 jours',
      'Jusqu\'à 5 QR codes',
      '1 entreprise',
      'Analytics de base',
      'Support email'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Parfait pour les petites entreprises',
    price_monthly: 3900, // 39€
    price_yearly: 39000, // 390€
    max_qr_codes: 50,
    max_businesses: 3,
    features: [
      'Jusqu\'à 50 QR codes',
      'Jusqu\'à 3 entreprises',
      'Analytics avancées',
      'Support email',
      'Export des données',
      'Branding personnalisé'
    ]
  },
  {
    id: 'agency',
    name: 'Agence',
    description: 'Idéal pour les agences et grandes entreprises',
    price_monthly: 7900, // 79€
    price_yearly: 79000, // 790€
    max_qr_codes: null, // Illimité
    max_businesses: 10,
    features: [
      'QR codes illimités',
      'Jusqu\'à 10 entreprises',
      'Analytics avancées',
      'Support prioritaire',
      'Export des données',
      'Branding personnalisé'
    ]
  }
];

export default function BillingPage() {
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch("/api/billing", { cache: "no-store" });
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.error || "Failed to load billing data");
      }
      
      // Utiliser les données de l'API
      setSubscriptionInfo(json);
      
      console.log("📊 Billing data loaded:", {
        subscription: json.subscription,
        plan: json.plan,
        isAuthenticated: json.isAuthenticated,
        hasSubscriptionActive: json.hasSubscriptionActive,
        isTrialActive: json.isTrialActive
      });
    } catch (error) {
      console.error('Error loading billing data:', error);
      // Créer un objet par défaut pour éviter les erreurs d'affichage
      setSubscriptionInfo({
        plan: null,
        subscription: null,
        features: {},
        canCreateQR: false,
        canCreateBusiness: false,
        remainingQRCodes: 0,
        remainingBusinesses: 0,
        isTrialActive: false,
        trialDaysLeft: 0,
        hasFeature: () => false
      });
    } finally {
      setLoading(false);
    }
  };

  const hasFeature = (feature: string) => {
    return subscriptionInfo?.features?.[feature] || false;
  };

  const handleStartTrial = async () => {
    setUpdating(true);
    try {
      // Démarrer l'essai gratuit du plan Pro
      const response = await fetch("/api/billing/start-trial", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ planId: 'pro' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start trial");
      }

      // Recharger les données pour montrer le trial actif
      await loadData();
    } catch (error) {
      console.error('Error starting trial:', error);
      alert('Erreur lors du démarrage de l\'essai. Veuillez réessayer.');
    } finally {
      setUpdating(false);
    }
  };

  const handlePlanChange = async (planId: string, billingCycle: 'monthly' | 'yearly' = 'monthly') => {
    setUpdating(true);
    try {
      // Créer une session Stripe Checkout pour les plans payants
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ planId, billingCycle })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }
      
      // Rediriger vers Stripe Checkout
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      if (stripe) {
        const { error } = await (stripe as any).redirectToCheckout({
          sessionId: data.sessionId
        });
        
        if (error) {
          console.error('Stripe checkout error:', error);
          alert('Erreur lors du paiement. Veuillez réessayer.');
        }
      } else {
        console.error('Failed to load Stripe');
        alert('Erreur lors du chargement du système de paiement.');
      }
    } catch (error) {
      console.error('Error changing plan:', error);
      alert('Erreur lors du changement d\'abonnement. Veuillez réessayer.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  if (!subscriptionInfo) {
    return <div className="p-8">Erreur de chargement</div>;
  }

  const currentPlan = subscriptionInfo.plan;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Facturation</h1>
          <p className="text-muted-foreground">Gérez votre abonnement et vos factures</p>
        </div>
      </div>

      {/* Trial Active Section */}
      {subscriptionInfo.isTrialActive && subscriptionInfo.plan && (
        <Card className="card-enhanced border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>
              <h2 className="text-xl font-semibold text-blue-800">🎯 Essai Gratuit Actif</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-blue-700">
              Votre essai gratuit de 7 jours est actif ! Profitez de toutes les fonctionnalités premium.
            </p>
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-blue-800">⏰ Temps restant :</h3>
                <span className="text-lg font-bold text-blue-600">
                  {subscriptionInfo.trialDaysLeft || 0} jours
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${Math.max(0, (subscriptionInfo.trialDaysLeft || 0) / 7 * 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">✨ Fonctionnalités incluses :</h3>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• QR codes illimités</li>
                <li>• Entreprises illimitées</li>
                <li>• Analytics avancées</li>
                <li>• Support prioritaire</li>
              </ul>
            </div>
            <Button 
              onClick={() => window.location.href = '/app'}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              🚀 Accéder au dashboard
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Onboarding Section for New Users */}
      {(!subscriptionInfo.plan || subscriptionInfo.plan.slug === 'starter') && (
        <Card className="card-enhanced border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle>
              <h2 className="text-xl font-semibold text-green-800">🎉 Bienvenue sur TrustReview !</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-green-700">
              Commencez votre essai gratuit de 7 jours pour découvrir toutes les fonctionnalités de TrustReview.
            </p>
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">✨ Votre essai 7 jours inclut :</h3>
              <ul className="space-y-1 text-sm text-green-700">
                <li>• QR codes illimités</li>
                <li>• Entreprises illimitées</li>
                <li>• Analytics avancées</li>
                <li>• Support prioritaire</li>
              </ul>
            </div>
            <Button 
              onClick={handleStartTrial}
              disabled={updating}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {updating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Configuration en cours...
                </>
              ) : (
                <>
                  🚀 Démarrer mon essai gratuit
                </>
              )}
            </Button>
            <p className="text-xs text-green-600 text-center">
              Aucune carte requise • Annulez à tout moment
            </p>
          </CardContent>
        </Card>
      )}

      {/* Current Subscription */}
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle>
            <h2 className="text-xl font-semibold">Abonnement actuel</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!subscriptionInfo ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Aucun abonnement actif</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{subscriptionInfo.plan?.name || 'Aucun plan'}</h3>
                  <p className="text-sm text-muted-foreground">{subscriptionInfo.plan?.description}</p>
                </div>
                <Badge variant={subscriptionInfo.isTrialActive ? "secondary" : "default"}>
                  {subscriptionInfo.isTrialActive ? `Essai (${subscriptionInfo.trialDaysLeft}j restants)` : 'Actif'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-slate-50">
                  <div className="text-2xl font-bold text-blue-600">
                    {subscriptionInfo.remainingQRCodes === null ? '∞' : subscriptionInfo.remainingQRCodes}
                  </div>
                  <div className="text-xs text-muted-foreground">QR codes restants</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-50">
                  <div className="text-2xl font-bold text-blue-600">
                    {subscriptionInfo.remainingBusinesses === null ? '∞' : subscriptionInfo.remainingBusinesses}
                  </div>
                  <div className="text-xs text-muted-foreground">Entreprises restantes</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Choisir votre abonnement</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {STATIC_PLANS.map((plan: any) => {
            const isCurrentPlan = subscriptionInfo?.plan?.id === plan.id;
            const monthlyPrice = plan.price_monthly / 100;
            const yearlyPrice = plan.price_yearly / 100;
            const yearlySavings = monthlyPrice * 12 - yearlyPrice;

            return (
              <Card key={plan.id} className={`card-enhanced relative ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}>
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">Actuel</Badge>
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle>
                    <h3 className="text-lg font-bold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold">
                      {monthlyPrice}€
                      <span className="text-sm font-normal text-muted-foreground">
                        /mois
                      </span>
                    </div>
                    
                    <div className="text-sm text-green-600">
                      Annuel : {yearlyPrice}€ (économisez {yearlySavings}€)
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">QR codes :</span>
                      <span className="text-sm text-muted-foreground">
                        {plan.max_qr_codes === null ? 'Illimités' : plan.max_qr_codes}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Entreprises :</span>
                      <span className="text-sm text-muted-foreground">
                        {plan.max_businesses === null ? 'Illimitées' : plan.max_businesses}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {plan.features.map((feature: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {isCurrentPlan ? (
                    <Button variant="default" disabled className="w-full">
                      Plan actuel
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button 
                        onClick={() => handlePlanChange(plan.id, 'monthly')}
                        disabled={updating}
                        className="w-full"
                      >
                        {monthlyPrice}€/mois
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handlePlanChange(plan.id, 'yearly')}
                        disabled={updating}
                        className="w-full"
                      >
                        {yearlyPrice}€/an
                        <span className="ml-1 text-xs text-green-600">-17%</span>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
