import { createHash } from 'crypto';

/**
 * Génère un UUID déterministe basé sur un email pour les sessions temporaires
 * Permet une cohérence création/lecture pour les utilisateurs non authentifiés
 */
export function generateDeterministicUuid(email: string): string {
  const emailHash = createHash('sha256').update(email).digest('hex');
  const deterministicUuid = [
    emailHash.substring(0, 8),
    emailHash.substring(8, 12),
    emailHash.substring(12, 16),
    emailHash.substring(16, 20),
    emailHash.substring(20, 32)
  ].join('-');
  
  return deterministicUuid;
}

/**
 * Exemple: sankush.vevo@gmail.com → 5d41402a-bc4b-2a76-b971-9d911017c592
 */
export function getTemporaryUserId(email: string): string {
  return generateDeterministicUuid(email);
}
