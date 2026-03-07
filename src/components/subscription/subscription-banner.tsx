"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { checkSubscriptionAccess } from "@/lib/subscription-guard";

interface SubscriptionBannerProps {
  className?: string;
}

export default function SubscriptionBanner({ className = "" }: SubscriptionBannerProps) {
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      const status = await checkSubscriptionAccess();
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Error loading subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !subscriptionStatus || subscriptionStatus.canAccess) {
    return null;
  }

  const getBannerVariant = () => {
    // Vrai abonnement expiré = rouge
    if (subscriptionStatus.isExpired && subscriptionStatus.message.includes("expir")) {
      return "expired";
    }
    // Trial actif = ambre (informatif)
    if (subscriptionStatus.isTrial) {
      return "trial";
    }
    // Problème d'accès mais pas "expiré" = gris
    if (!subscriptionStatus.canAccess) {
      return "warning";
    }
    return null;
  };

  const variant = getBannerVariant();
  
  if (!variant) return null;

  const bannerStyles: Record<string, string> = {
    expired: "bg-red-50 border-red-200 text-red-800",
    trial: "bg-amber-50 border-amber-200 text-amber-800", 
    warning: "bg-slate-50 border-slate-200 text-slate-800"
  };

  const buttonStyles: Record<string, string> = {
    expired: "bg-red-600 hover:bg-red-700 text-white",
    trial: "bg-amber-600 hover:bg-amber-700 text-white",
    warning: "bg-slate-600 hover:bg-slate-700 text-white"
  };

  return (
    <div className={`p-4 rounded-lg border ${bannerStyles[variant]} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {variant === 'expired' && <span className="text-lg">🚫</span>}
            {variant === 'trial' && <span className="text-lg">⏰</span>}
            {variant === 'warning' && <span className="text-lg">⚠️</span>}
            
            <div>
              <p className="font-semibold">
                {variant === 'expired' && 'Abonnement expiré'}
                {variant === 'trial' && 'Essai en cours'}
                {variant === 'warning' && 'Action requise'}
              </p>
              <p className="text-sm opacity-90">
                {subscriptionStatus.message}
              </p>
            </div>
          </div>
          
          <Badge variant="outline" className="ml-4">
            {subscriptionStatus.planName}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            className={buttonStyles[variant]}
            onClick={() => window.location.href = '/app/billing'}
          >
            {variant === 'expired' && 'Réactiver'}
            {variant === 'trial' && "S'abonner"}
            {variant === 'warning' && 'Mettre à jour'}
          </Button>
        </div>
      </div>
    </div>
  );
}
