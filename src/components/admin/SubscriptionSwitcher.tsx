"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SubscriptionSwitcherProps {
  onClose: () => void;
}

export default function SubscriptionSwitcher({ onClose }: SubscriptionSwitcherProps) {
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const plans = [
    { id: 'starter', name: 'Starter', max_businesses: 1, max_qr_codes: 5 },
    { id: 'pro', name: 'Pro', max_businesses: 3, max_qr_codes: 50 },
    { id: 'agency', name: 'Agency', max_businesses: 10, max_qr_codes: null }
  ];

  const statuses = [
    { value: 'trialing', label: 'Trial Actif' },
    { value: 'active', label: 'Actif' },
    { value: 'canceled', label: 'Annulé' },
    { value: 'past_due', label: 'Expiré' }
  ];

  const billingCycles = [
    { value: 'monthly', label: 'Mensuel' },
    { value: 'yearly', label: 'Annuel' }
  ];

  useEffect(() => {
    loadCurrentSubscription();
  }, []);

  const loadCurrentSubscription = async () => {
    try {
      const res = await fetch("/api/billing", { cache: "no-store" });
      const data = await res.json();
      setCurrentPlan(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSubscription = async (planId: string, status: string, billingCycle: string) => {
    setUpdating(true);
    try {
      const response = await fetch("/api/dev/switch-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, status, billingCycle })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update subscription");
      }

      await loadCurrentSubscription();
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Erreur lors de la mise à jour: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setUpdating(false);
    }
  };

  const setTrial = async (days: number) => {
    setUpdating(true);
    try {
      const trialEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      const response = await fetch("/api/dev/set-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trialEnd: trialEnd.toISOString() })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to set trial");
      }

      await loadCurrentSubscription();
    } catch (error) {
      console.error('Error setting trial:', error);
      alert('Erreur lors de la configuration du trial: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="p-4">Chargement...</div>;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>🧪 Test d'Abonnement</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* État Actuel */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">État Actuel</h3>
            {currentPlan ? (
              <div className="space-y-1 text-sm">
                <div><span className="font-medium">Plan:</span> {currentPlan.plan?.name || 'Non défini'}</div>
                <div><span className="font-medium">Status:</span> {currentPlan.subscription?.status || 'Non défini'}</div>
                <div><span className="font-medium">Trial:</span> {currentPlan.isTrialActive ? `Oui (${currentPlan.trialDaysLeft}j restants)` : 'Non'}</div>
                <div><span className="font-medium">Entreprises:</span> {currentPlan.remainingBusinesses === null ? 'Illimitées' : `${currentPlan.remainingBusinesses} restantes`}</div>
                <div><span className="font-medium">QR Codes:</span> {currentPlan.remainingQRCodes === null ? 'Illimités' : `${currentPlan.remainingQRCodes} restants`}</div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Aucun abonnement trouvé</div>
            )}
          </div>

          {/* Changement Rapide de Plan */}
          <div>
            <h3 className="font-semibold mb-3">Changement Rapide de Plan</h3>
            <div className="grid grid-cols-3 gap-2">
              {plans.map((plan) => (
                <Button
                  key={plan.id}
                  variant={currentPlan?.plan?.slug === plan.id ? "default" : "outline"}
                  onClick={() => updateSubscription(plan.id, 'active', 'monthly')}
                  disabled={updating}
                  className="text-sm"
                >
                  {plan.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <h3 className="font-semibold mb-3">Status d'Abonnement</h3>
            <div className="grid grid-cols-2 gap-2">
              {statuses.map((status) => (
                <Button
                  key={status.value}
                  variant={currentPlan?.subscription?.status === status.value ? "default" : "outline"}
                  onClick={() => updateSubscription(currentPlan?.plan?.slug || 'starter', status.value, 'monthly')}
                  disabled={updating}
                  className="text-sm"
                >
                  {status.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Cycle de Facturation */}
          <div>
            <h3 className="font-semibold mb-3">Cycle de Facturation</h3>
            <div className="grid grid-cols-2 gap-2">
              {billingCycles.map((cycle) => (
                <Button
                  key={cycle.value}
                  variant="outline"
                  onClick={() => updateSubscription(currentPlan?.plan?.slug || 'starter', currentPlan?.subscription?.status || 'active', cycle.value)}
                  disabled={updating}
                  className="text-sm"
                >
                  {cycle.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Trial Controls */}
          <div>
            <h3 className="font-semibold mb-3">Contrôles Trial</h3>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => setTrial(7)}
                disabled={updating}
                className="text-sm"
              >
                Trial 7 jours
              </Button>
              <Button
                variant="outline"
                onClick={() => setTrial(1)}
                disabled={updating}
                className="text-sm"
              >
                Trial 1 jour
              </Button>
              <Button
                variant="outline"
                onClick={() => setTrial(-1)}
                disabled={updating}
                className="text-sm"
              >
                Expirer Trial
              </Button>
            </div>
          </div>

          {/* Scénarios Prédéfinis */}
          <div>
            <h3 className="font-semibold mb-3">Scénarios de Test</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => updateSubscription('starter', 'trialing', 'monthly')}
                disabled={updating}
                className="w-full text-sm justify-start"
              >
                🆕 Nouvel utilisateur (Starter + Trial 7j)
              </Button>
              <Button
                variant="outline"
                onClick={() => updateSubscription('pro', 'active', 'monthly')}
                disabled={updating}
                className="w-full text-sm justify-start"
              >
                💼 Pro Mensuel Actif
              </Button>
              <Button
                variant="outline"
                onClick={() => updateSubscription('agency', 'active', 'yearly')}
                disabled={updating}
                className="w-full text-sm justify-start"
              >
                🏢 Agency Annuel Actif
              </Button>
              <Button
                variant="outline"
                onClick={() => { updateSubscription('starter', 'canceled', 'monthly'); setTrial(-1); }}
                disabled={updating}
                className="w-full text-sm justify-start"
              >
                ❌ Abonnement Expiré
              </Button>
            </div>
          </div>

          {/* Refresh */}
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={loadCurrentSubscription}
              disabled={updating}
              className="w-full"
            >
              🔄 Rafraîchir l'état
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
