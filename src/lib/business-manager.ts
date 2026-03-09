import { createSupabaseServer, createSupabaseServiceClient } from "@/lib/supabase-server";
import type { RequestIdentity } from "@/lib/request-identity";
import { getRequestIdentity } from "@/lib/request-identity";
import { getTemporaryUserId } from "@/lib/temp-uuid";
import { getPlanQuotas, calculateRemainingQuotas } from "@/lib/quotas";
import { setFirstBusinessAsActive } from "@/lib/active-business";

export interface Business {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  google_review_url?: string;
  threshold_positive?: number;
  notification_email?: string | null;
  is_active: boolean;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessManager {
  businesses: Business[];
  activeBusiness: Business | null;
  canCreateMore: boolean;
  remainingSlots: number | null;
}

export async function getUserBusinesses(identity?: RequestIdentity): Promise<BusinessManager> {
  console.log(" [BUSINESS-MANAGER] getUserBusinesses appelé");
  
  const auth = identity ?? await getRequestIdentity();
  
  if (!auth.isAuthenticated || !auth.userId) {
    throw new Error('User not authenticated');
  }
  
  // Uniquement Supabase - plus de sessions temporaires
  const supabase = auth.supabase ?? await createSupabaseServer();
  const userId = auth.userId;
  
  console.log(" [BUSINESS-MANAGER] Auth result:", {
    isAuthenticated: auth.isAuthenticated,
    email: auth.email
  });
  
  // Récupérer l'abonnement
  let subscription, subscriptionError;
  
  const { data: subscriptionData, error: subError } = await supabase
    .from('subscriptions')
    .select(`
      *,
      plan:subscription_plans(*)
    `)
    .eq('user_id', userId)
    .single();
    
  subscription = subscriptionData;
  subscriptionError = subError;

  if (subscriptionError) {
    console.error(" [BUSINESS-MANAGER] Erreur récupération abonnement:", subscriptionError);
  }

  console.log(" [BUSINESS-MANAGER] Subscription trouvée:", subscription ? {
  console.log("🏢 [BUSINESS-MANAGER] Subscription trouvée:", subscription ? {
    plan: subscription.plan?.slug
  } : 'null');

  // Utiliser la source de vérité unique pour les quotas
  const planQuotas = getPlanQuotas(subscription?.plan?.slug);
  console.log("🏢 [BUSINESS-MANAGER] Plan quotas utilisés:", planQuotas);

  // Récupérer toutes les entreprises de l'utilisateur
  console.log("🔍 [BUSINESS-CHECK-DEBUG] QUOTA CHECK:", {
    sessionType: auth.isTempSession ? "TEMPORARY" : "SUPABASE",
    clientType: auth.isTempSession ? "createSupabaseServiceClient()" : "createSupabaseServer()",
    userId: userId,
    email: auth.email,
    requete: `SELECT * FROM businesses WHERE owner_user_id = '${userId}'`
  });
  
  let businesses, error;
  
  if (auth.isTempSession) {
    // Pour les sessions temporaires, chercher par email au lieu de UUID
    const result = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_user_id', userId)
      .order('created_at', { ascending: false });
    businesses = result.data;
    error = result.error;
    
    console.log("🔍 [BUSINESS-CHECK-DEBUG] RÉSULTAT QUOTA CHECK:", {
      nombreEntreprises: businesses?.length || 0,
      entreprises: businesses?.map(b => ({
        id: b.id,
        name: b.name,
        owner_user_id: b.owner_user_id
      }))
    });
  } else {
    const result = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_user_id', userId)
      .order('created_at', { ascending: false });
    businesses = result.data;
    error = result.error;
    
    console.log("🔍 [BUSINESS-CHECK-DEBUG] RÉSULTAT QUOTA CHECK:", {
      nombreEntreprises: businesses?.length || 0,
      entreprises: businesses?.map(b => ({
        id: b.id,
        name: b.name,
        owner_user_id: b.owner_user_id
      }))
    });
  }

  if (error) {
    console.error('🏢 [BUSINESS-MANAGER] Error fetching businesses:', error);
    throw error;
  }

  const businessList = businesses || [];
  console.log("🏢 [BUSINESS-MANAGER] Entreprises trouvées:", businessList.length);
  
  const canCreateMore = planQuotas.max_businesses === null || businessList.length < planQuotas.max_businesses;
  const remainingSlots = planQuotas.max_businesses === null ? null : Math.max(0, planQuotas.max_businesses - businessList.length);
  
  console.log("🏢 [BUSINESS-MANAGER] Calcul quotas:", {
    businessListLength: businessList.length,
    maxBusinesses: planQuotas.max_businesses,
    canCreateMore,
    remainingSlots
  });

  // Récupérer l'entreprise active depuis localStorage (côté client)
  let activeBusiness: Business | null = null;
  
  if (typeof window !== 'undefined') {
    const activeBusinessId = localStorage.getItem('activeBusinessId');
    if (activeBusinessId) {
      activeBusiness = businessList.find(b => b.id === activeBusinessId) || businessList[0] || null;
    } else {
      activeBusiness = businessList[0] || null;
      if (activeBusiness) {
        localStorage.setItem('activeBusinessId', activeBusiness.id);
      }
    }
  } else {
    // Côté serveur, prendre la première entreprise
    activeBusiness = businessList[0] || null;
  }

  return {
    businesses: businessList,
    activeBusiness,
    canCreateMore,
    remainingSlots
  };
}

export async function setActiveBusiness(businessId: string): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem('activeBusinessId', businessId);
  }
}

export async function createBusiness(businessData: Partial<Business>, identity?: RequestIdentity): Promise<Business> {
  const auth = identity ?? await getRequestIdentity();
  
  // LOGS DIAGNOSTIC - Étape 1: Type de session
  console.log("🔍 [DIAG] Session type detected:", {
    isAuthenticated: auth.isAuthenticated,
    isTempSession: auth.isTempSession,
    email: auth.email,
    hasUser: !!auth.user,
    userId: auth.user?.id
  });
  
  if (!auth.isAuthenticated) {
    throw new Error('User not authenticated');
  }

  // Vérifier les limites d'abonnement
  const businessManager = await getUserBusinesses(auth);
  if (!businessManager.canCreateMore) {
    throw new Error(`Limite d'entreprises atteinte (${businessManager.businesses.length}/${businessManager.remainingSlots === null ? '∞' : businessManager.businesses.length + businessManager.remainingSlots})`);
  }

  // LOGS DIAGNOSTIC - Étape 2: Variables d'environnement
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log("🔍 [DIAG] Environment variables:", {
    hasServiceRoleKey: !!serviceRoleKey,
    serviceRoleKeyLength: serviceRoleKey?.length || 0,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  });

  // LOGS DIAGNOSTIC - Étape 3: Choix du client
  let clientType: string;
  let supabase;
  
  if (auth.isTempSession) {
    console.log("🔍 [DIAG] Temp session detected, attempting service role client...");
    supabase = await createSupabaseServiceClient();
    clientType = "createSupabaseServiceClient()";
  } else {
    console.log("🔍 [DIAG] Normal Supabase session, using standard client...");
    supabase = auth.supabase ?? await createSupabaseServer();
    clientType = "createSupabaseServer()";
  }
  
  console.log("🔍 [DIAG] Client selected:", clientType);
  
  // Déterminer l'ID utilisateur selon le type d'authentification
  let userId: string;
  userId = auth.isTempSession ? getTemporaryUserId(auth.email) : auth.userId!;

  // LOGS DIAGNOSTIC - Étape 4: Juste avant l'insert
  console.log("🔍 [DIAG] PRE-INSERT ANALYSIS:", {
    sessionType: auth.isTempSession ? "TEMPORARY" : "SUPABASE",
    clientUsed: clientType,
    owner_user_id: userId,
    serviceRoleKeyPresent: !!serviceRoleKey,
    willUseServiceRole: auth.isTempSession && !!serviceRoleKey
  });

  const { data, error } = await supabase
    .from('businesses')
    .insert({
      ...businessData,
      owner_user_id: userId,
      is_active: businessData.is_active ?? true,
      threshold_positive: businessData.threshold_positive ?? 4,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  // LOGS DIAGNOSTIC - Étape 5: Résultat de l'insert
  console.log("🔍 [INSERT-DEBUG] LIGNE CRÉÉE:", {
    success: !error,
    error: error ? {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    } : null,
    ligneInsérée: data ? {
      id: data.id,
      name: data.name,
      slug: data.slug,
      owner_user_id: data.owner_user_id,
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at
    } : null,
    sessionType: auth.isTempSession ? "TEMPORARY" : "SUPABASE",
    clientUsed: clientType,
    owner_user_id_utilisé: userId
  });

  if (error) {
    console.error('🔍 [DIAG] INSERT FAILED:', error);
    throw error;
  }

  // Définir comme entreprise active si c'est la première (source de vérité unique)
  if (businessManager.businesses.length === 0) {
    await setFirstBusinessAsActive(userId, auth.isTempSession);
  }

  return data;
}

export async function updateBusiness(businessId: string, updates: Partial<Business>, identity?: RequestIdentity): Promise<Business> {
  const auth = identity ?? await getRequestIdentity();
  
  if (!auth.isAuthenticated || !auth.userId) {
    throw new Error('User not authenticated');
  }
  
  const supabase = auth.isTempSession
    ? await createSupabaseServiceClient()
    : auth.supabase ?? await createSupabaseServer();

  const { data, error } = await supabase
    .from('businesses')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', businessId)
    .eq('owner_user_id', auth.userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating business:', error);
    throw error;
  }

  return data;
}

export async function deleteBusiness(businessId: string, identity?: RequestIdentity): Promise<void> {
  const auth = identity ?? await getRequestIdentity();
  
  if (!auth.isAuthenticated || !auth.userId) {
    throw new Error('User not authenticated');
  }
  
  const supabase = auth.isTempSession
    ? await createSupabaseServiceClient()
    : auth.supabase ?? await createSupabaseServer();

  // Vérifier que c'est bien l'entreprise de l'utilisateur
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('owner_user_id', auth.userId)
    .single();

  if (!business) {
    throw new Error('Business not found or access denied');
  }

  const { error } = await supabase
    .from('businesses')
    .delete()
    .eq('id', businessId)
    .eq('owner_user_id', auth.userId);

  if (error) {
    console.error('Error deleting business:', error);
    throw error;
  }

  // Si c'était l'entreprise active, définir la première entreprise restante comme active
  if (typeof window !== 'undefined') {
    const activeBusinessId = localStorage.getItem('activeBusinessId');
    if (activeBusinessId === businessId) {
      const remainingBusinesses = await getUserBusinesses();
      if (remainingBusinesses.businesses.length > 0) {
        localStorage.setItem('activeBusinessId', remainingBusinesses.businesses[0].id);
      } else {
        localStorage.removeItem('activeBusinessId');
      }
    }
  }
}
