export interface SubscriptionGuardResult {
  canAccess: boolean;
  isExpired: boolean;
  isTrial: boolean;
  message: string;
  planName: string;
  features: Record<string, boolean>;
}

export async function checkSubscriptionAccess(): Promise<SubscriptionGuardResult> {
  try {
    // Utiliser l'API billing pour avoir les infos à jour
    const response = await fetch('/api/billing', { cache: 'no-store' });
    const billingData = await response.json();
    
    if (!billingData.isAuthenticated) {
      return {
        canAccess: false,
        isExpired: false, // Pas "expiré", juste "non connecté"
        isTrial: false,
        message: "Veuillez vous connecter",
        planName: "Aucun",
        features: {}
      };
    }

    // Si trial actif, accès autorisé
    if (billingData.isTrialActive) {
      return {
        canAccess: true,
        isExpired: false,
        isTrial: true,
        message: "Essai gratuit actif",
        planName: billingData.plan?.name || "Essai",
        features: {}
      };
    }

    // Si abonnement actif, accès autorisé
    if (billingData.hasSubscriptionActive) {
      return {
        canAccess: true,
        isExpired: false,
        isTrial: false,
        message: "Abonnement actif",
        planName: billingData.plan?.name || "Actif",
        features: {}
      };
    }

    // Aucun accès valide
    return {
      canAccess: false,
      isExpired: billingData.subscriptionStatus === 'canceled' || billingData.subscriptionStatus === 'past_due',
      isTrial: false,
      message: billingData.subscriptionStatus === 'none' ? "Choisissez un abonnement" : "Votre abonnement nécessite une action",
      planName: billingData.plan?.name || "Aucun",
      features: {}
    };

  } catch (error) {
    console.error('Error checking subscription access:', error);
    return {
      canAccess: false,
      isExpired: true,
      isTrial: false,
      message: "Erreur de vérification de l'abonnement. Contactez le support.",
      planName: "Erreur",
      features: {}
    };
  }
}

export function canPerformAction(features: Record<string, boolean>, feature: string): boolean {
  return features[feature] === true;
}

export function getLimitMessage(subscriptionInfo: any, action: string): string {
  const { plan, remainingQRCodes, remainingBusinesses } = subscriptionInfo;
  
  switch (action) {
    case 'create_qr':
      if (remainingQRCodes === 0) {
        return `Vous avez atteint votre limite de ${plan.max_qr_codes} QR codes. Passez à un plan supérieur pour en créer plus.`;
      }
      break;
    case 'create_business':
      if (remainingBusinesses === 0) {
        return `Vous avez atteint votre limite de ${plan.max_businesses} entreprises. Passez à un plan supérieur pour en créer plus.`;
      }
      break;
  }
  
  return "";
}
