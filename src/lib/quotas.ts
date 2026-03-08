/**
 * SOURCE DE VÉRITÉ UNIQUE DES QUOTAS
 * Utilisée par toute l'application pour la cohérence
 */

export interface PlanQuotas {
  max_businesses: number | null;  // null = illimité
  max_qr_codes: number | null;   // null = illimité
  name: string;
  slug: string;
}

export const PLAN_QUOTAS: Record<string, PlanQuotas> = {
  starter: {
    max_businesses: 1,
    max_qr_codes: 5,
    name: "Starter",
    slug: "starter"
  },
  pro: {
    max_businesses: 3,
    max_qr_codes: 50,
    name: "Pro",
    slug: "pro"
  },
  agency: {
    max_businesses: 10,
    max_qr_codes: null, // illimité
    name: "Agency",
    slug: "agency"
  }
};

/**
 * Récupère les quotas pour un plan donné
 * Fallback sur starter si plan non trouvé
 */
export function getPlanQuotas(planSlug: string | null | undefined): PlanQuotas {
  if (!planSlug) return PLAN_QUOTAS.starter;
  
  const quotas = PLAN_QUOTAS[planSlug.toLowerCase()];
  return quotas || PLAN_QUOTAS.starter;
}

/**
 * Calcule les quotas restants pour un utilisateur
 */
export function calculateRemainingQuotas(
  planSlug: string | null | undefined,
  currentBusinesses: number,
  currentQRCodes: number
) {
  const quotas = getPlanQuotas(planSlug);
  
  return {
    canCreateBusiness: quotas.max_businesses === null || currentBusinesses < quotas.max_businesses,
    canCreateQR: quotas.max_qr_codes === null || currentQRCodes < quotas.max_qr_codes,
    remainingBusinesses: quotas.max_businesses === null ? null : Math.max(0, quotas.max_businesses - currentBusinesses),
    remainingQRCodes: quotas.max_qr_codes === null ? null : Math.max(0, quotas.max_qr_codes - currentQRCodes),
    maxBusinesses: quotas.max_businesses,
    maxQRCodes: quotas.max_qr_codes
  };
}

/**
 * Génère un message de limite cohérent
 */
export function getQuotaLimitMessage(
  action: 'create_qr' | 'create_business',
  planSlug: string | null | undefined,
  remainingQRCodes?: number | null,
  remainingBusinesses?: number | null
): string {
  const quotas = getPlanQuotas(planSlug);
  
  switch (action) {
    case 'create_qr':
      if (quotas.max_qr_codes === null) {
        return "Votre plan autorise des QR codes illimités.";
      }
      const qrRemaining = remainingQRCodes !== undefined ? remainingQRCodes : quotas.max_qr_codes;
      if (qrRemaining !== null && qrRemaining <= 0) {
        return `Vous avez atteint votre limite de ${quotas.max_qr_codes} QR codes. Passez à un plan supérieur pour en créer plus !`;
      }
      return "";
      
    case 'create_business':
      if (quotas.max_businesses === null) {
        return "Votre plan autorise des entreprises illimitées.";
      }
      const businessRemaining = remainingBusinesses !== undefined ? remainingBusinesses : quotas.max_businesses;
      if (businessRemaining !== null && businessRemaining <= 0) {
        return `Vous avez atteint votre limite de ${quotas.max_businesses} entreprises. Passez à un plan supérieur pour en créer plus !`;
      }
      return "";
      
    default:
      return "";
  }
}
