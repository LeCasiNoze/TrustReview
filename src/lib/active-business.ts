/**
 * GESTION UNIFIÉE DE L'ENTREPRISE ACTIVE
 * Source de vérité unique : businesses.is_active
 */

import { createSupabaseServer, createSupabaseServiceClient } from "@/lib/supabase-server";
import type { RequestIdentity } from "@/lib/request-identity";
import { getRequestIdentity } from "@/lib/request-identity";

/**
 * Récupère l'entreprise active d'un utilisateur
 */
export async function getActiveBusiness(identity?: RequestIdentity): Promise<any> {
  const auth = identity ?? await getRequestIdentity();
  
  if (!auth.isAuthenticated || !auth.userId) {
    return null;
  }

  const supabase = auth.isTempSession
    ? await createSupabaseServiceClient()
    : auth.supabase ?? await createSupabaseServer();
  const userId = auth.userId;

  console.log("🔍 [ACTIVE-BUSINESS] Recherche entreprise active:", {
    sessionType: auth.isTempSession ? "TEMPORARY" : "SUPABASE",
    userId: userId
  });

  // Chercher l'entreprise avec is_active = true
  const { data: business, error } = await supabase
    .from("businesses")
    .select("id, name, slug, google_review_url, threshold_positive, is_active, logo_url, notification_email, notif_new_review, notif_low_rating")
    .eq("owner_user_id", userId)
    .eq("is_active", true)
    .single();

  if (error || !business) {
    console.log("🔍 [ACTIVE-BUSINESS] Aucune entreprise active trouvée");
    return null;
  }

  console.log("🔍 [ACTIVE-BUSINESS] Entreprise active trouvée:", business.id, business.name);
  return business;
}

/**
 * Définit une entreprise comme active (UNIQUE)
 * Désactive toutes les autres entreprises du même utilisateur
 */
export async function setActiveBusiness(businessId: string, identity?: RequestIdentity): Promise<void> {
  const auth = identity ?? await getRequestIdentity();
  
  if (!auth.isAuthenticated || !auth.userId) {
    throw new Error("Unauthorized");
  }

  const supabase = auth.isTempSession
    ? await createSupabaseServiceClient()
    : auth.supabase ?? await createSupabaseServer();
  const userId = auth.userId;

  console.log("🔍 [ACTIVE-BUSINESS] Activation entreprise:", {
    sessionType: auth.isTempSession ? "TEMPORARY" : "SUPABASE",
    userId: userId,
    businessId: businessId
  });

  // 1. Désactiver toutes les entreprises de l'utilisateur
  const { error: deactivateError } = await supabase
    .from("businesses")
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq("owner_user_id", userId);

  if (deactivateError) {
    console.error("🔍 [ACTIVE-BUSINESS] Erreur désactivation autres entreprises:", deactivateError);
    throw deactivateError;
  }

  // 2. Activer l'entreprise sélectionnée
  const { error: activateError } = await supabase
    .from("businesses")
    .update({ 
      is_active: true,
      updated_at: new Date().toISOString()
    })
    .eq("id", businessId)
    .eq("owner_user_id", userId);

  if (activateError) {
    console.error("🔍 [ACTIVE-BUSINESS] Erreur activation entreprise:", activateError);
    throw activateError;
  }

  console.log("🔍 [ACTIVE-BUSINESS] Entreprise activée avec succès:", businessId);
}

/**
 * Définit la première entreprise comme active (pour la création)
 */
export async function setFirstBusinessAsActive(userId: string, isTempSession: boolean = false): Promise<void> {
  const supabase = isTempSession ? await createSupabaseServiceClient() : await createSupabaseServer();

  console.log("🔍 [ACTIVE-BUSINESS] Activation première entreprise:", {
    sessionType: isTempSession ? "TEMPORARY" : "SUPABASE",
    userId: userId
  });

  // Vérifier s'il y a déjà une entreprise active
  const { data: existingActive } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_user_id", userId)
    .eq("is_active", true)
    .single();

  if (existingActive) {
    console.log("🔍 [ACTIVE-BUSINESS] Une entreprise est déjà active, annulation");
    return;
  }

  // Activer la première entreprise (la plus récente)
  const { error } = await supabase
    .from("businesses")
    .update({ 
      is_active: true,
      updated_at: new Date().toISOString()
    })
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("🔍 [ACTIVE-BUSINESS] Erreur activation première entreprise:", error);
    throw error;
  }

  console.log("🔍 [ACTIVE-BUSINESS] Première entreprise activée avec succès");
}

/**
 * Migration : Nettoie les entreprises actives multiples
 */
export async function cleanupMultipleActiveBusinesses(userId: string, isTempSession: boolean = false): Promise<void> {
  const supabase = isTempSession ? await createSupabaseServiceClient() : await createSupabaseServer();

  console.log("🔍 [ACTIVE-BUSINESS] Nettoyage entreprises actives multiples:", userId);

  // Récupérer toutes les entreprises actives
  const { data: activeBusinesses } = await supabase
    .from("businesses")
    .select("id, created_at")
    .eq("owner_user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (!activeBusinesses || activeBusinesses.length <= 1) {
    console.log("🔍 [ACTIVE-BUSINESS] Pas de nettoyage nécessaire");
    return;
  }

  // Garder la plus récente, désactiver les autres
  const toKeep = activeBusinesses[0];
  const toDeactivate = activeBusinesses.slice(1);

  console.log(`🔍 [ACTIVE-BUSINESS] ${toDeactivate.length} entreprises à désactiver`);

  for (const business of toDeactivate) {
    await supabase
      .from("businesses")
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq("id", business.id);
  }

  console.log(`🔍 [ACTIVE-BUSINESS] Entreprise ${toKeep.id} gardée comme active`);
}
