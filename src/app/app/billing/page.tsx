"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getUserSubscriptionInfo, getSubscriptionPlans } from "@/lib/subscription";
import { UserSubscriptionInfo, SubscriptionPlan } from "@/lib/types/subscription";

export default function BillingPage() {
  const [subscriptionInfo, setSubscriptionInfo] = useState<UserSubscriptionInfo | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [info, plansData] = await Promise.all([
        getUserSubscriptionInfo(),
        getSubscriptionPlans()
      ]);
      setSubscriptionInfo(info);
      setPlans(plansData);
    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async (planId: string, billingCycle: 'monthly' | 'yearly' = 'monthly') => {
    setUpdating(true);
    try {
      // Créer une session Stripe Checkout
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ planId, billingCycle })
      });

      if (response.ok) {
        const { sessionId } = await response.json();
        
        // Rediriger vers Stripe Checkout
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
        const { error } = await stripe!.redirectToCheckout({ sessionId });

        if (error) {
          console.error('Stripe checkout error:', error);
          alert('Erreur lors du paiement. Veuillez réessayer.');
        }
      } else {
        console.error('Failed to create checkout session');
        alert('Erreur lors de la création de la session de paiement.');
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      alert('Erreur lors du paiement. Veuillez réessayer.');
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
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Facturation & Abonnement</h1>
          <p className="page-desc">Gérez votre plan et vos fonctionnalités</p>
        </div>
      </div>

      {/* Current Plan Status */}
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Abonnement actuel</span>
            <Badge className={
              subscriptionInfo.isTrialActive ? "bg-amber-100 text-amber-800" :
              subscriptionInfo.subscription?.status === 'active' ? "bg-green-100 text-green-800" :
              "bg-slate-100 text-slate-800"
            }>
              {subscriptionInfo.isTrialActive ? `Essai - ${subscriptionInfo.trialDaysLeft}j restants` :
               subscriptionInfo.subscription?.status === 'active' ? 'Actif' : 'Inactif'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{currentPlan?.name}</h3>
              <p className="text-sm text-muted-foreground">{currentPlan?.description}</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Changer d'abonnement</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan?.id === plan.id;
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
                      {monthlyPrice === 0 ? 'Gratuit' : `${monthlyPrice}€`}
                      <span className="text-sm font-normal text-muted-foreground">
                        {monthlyPrice > 0 && '/mois'}
                      </span>
                    </div>
                    
                    {yearlyPrice > 0 && (
                      <div className="text-sm text-green-600">
                        Annuel : {yearlyPrice}€ (économisez {yearlySavings}€)
                      </div>
                    )}
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

                  {plan.id === subscriptionInfo.plan?.id ? (
                    <Button variant="default" disabled>
                      Plan actuel
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button 
                        variant="outline"
                        onClick={() => handlePlanChange(plan.id, 'monthly')}
                        disabled={updating}
                        className="w-full"
                      >
                        {plan.monthly_price}€/mois
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handlePlanChange(plan.id, 'yearly')}
                        disabled={updating}
                        className="w-full"
                      >
                        {plan.yearly_price}€/an
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

      {/* Features List */}
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle>Fonctionnalités disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { key: 'basic_stats', name: 'Statistiques de base' },
              { key: 'advanced_stats', name: 'Statistiques avancées' },
              { key: 'email_notifications', name: 'Notifications email' },
              { key: 'qr_customization', name: 'Personnalisation QR codes' },
              { key: 'multiple_businesses', name: 'Plusieurs entreprises' },
              { key: 'api_access', name: 'API d intégration' },
              { key: 'priority_support', name: 'Support prioritaire' },
              { key: 'exports', name: 'Exports de données' },
              { key: 'white_label', name: 'Branding blanc' },
              { key: 'multi_users', name: 'Multi-utilisateurs' }
            ].map(({ key, name }) => (
              <div key={key} className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                  subscriptionInfo.hasFeature(key) 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {subscriptionInfo.hasFeature(key) ? '✓' : '✗'}
                </span>
                <span className="text-sm">{name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
