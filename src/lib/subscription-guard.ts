import { getUserSubscriptionInfo } from './subscription';

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
    const subscriptionInfo = await getUserSubscriptionInfo();
    
    if (!subscriptionInfo || !subscriptionInfo.subscription || !subscriptionInfo.plan) {
      return {
        canAccess: false,
        isExpired: true,
        isTrial: false,
        message: "Aucun abonnement trouvé. Veuillez vous inscrire.",
        planName: "Aucun",
        features: {}
      };
    }

    const { subscription, plan } = subscriptionInfo;
    const isExpired = subscription.status === 'canceled' || subscription.status === 'past_due' || subscription.status === 'unpaid';
    const isTrial = subscription.status === 'trialing';
    
    let canAccess = true;
    let message = "";

    // Vérifier le statut de l'abonnement
    if (isExpired) {
      canAccess = false;
      message = "Votre abonnement a expiré. Renouvelez-le pour continuer à utiliser TrustReview.";
    } else if (isTrial && subscriptionInfo.trialDaysLeft !== null && subscriptionInfo.trialDaysLeft <= 0) {
      canAccess = false;
      message = "Votre période d'essai est terminée. Choisissez un abonnement pour continuer.";
    } else if (isTrial && subscriptionInfo.trialDaysLeft !== null && subscriptionInfo.trialDaysLeft <= 2) {
      message = `Votre essai se termine dans ${subscriptionInfo.trialDaysLeft} jour${subscriptionInfo.trialDaysLeft > 1 ? 's' : ''}.`;
    }

    return {
      canAccess,
      isExpired,
      isTrial,
      message,
      planName: plan.name,
      features: plan.features
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
