import { createSupabaseServer, createSupabaseServiceClient } from './supabase-server';
import { authenticateRequest } from './auth-middleware';
import { randomUUID } from 'crypto';

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

export async function getUserBusinesses(): Promise<BusinessManager> {
  console.log("🏢 [BUSINESS-MANAGER] getUserBusinesses appelé");
  
  // Utiliser le middleware d'authentification qui gère les sessions temporaires
  const auth = await authenticateRequest();
  console.log("🏢 [BUSINESS-MANAGER] Auth result:", {
    isAuthenticated: auth.isAuthenticated,
    isTempSession: auth.isTempSession,
    email: auth.email
  });
  
  if (!auth.isAuthenticated) {
    console.log("🏢 [BUSINESS-MANAGER] User non authentifié");
    throw new Error('User not authenticated');
  }

  // Utiliser le client approprié selon le type d'authentification
  const supabase = auth.isTempSession ? await createSupabaseServiceClient() : await createSupabaseServer();

  // Récupérer les infos d'abonnement pour vérifier les limites
  // Utiliser la logique côté serveur directement
  let userId: string;
  let subscription, subscriptionError;
  
  if (auth.isTempSession) {
    // Pour les sessions temporaires, créer un abonnement par défaut et un UUID déterministe
    console.log("🏢 [BUSINESS-MANAGER] Session temporaire détectée, utilisation abonnement starter par défaut");
    subscription = {
      plan: {
        slug: 'starter',
        max_businesses: 1
      }
    };
    subscriptionError = null;
    // Générer un UUID déterministe basé sur l'email pour les sessions temporaires
    const emailHash = Buffer.from(auth.email).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    const uuid = [
      emailHash.substring(0, 8),
      emailHash.substring(8, 12),
      emailHash.substring(12, 16),
      emailHash.substring(16, 20),
      emailHash.substring(20, 32)
    ].join('-');
    userId = uuid;
  } else {
    userId = auth.user.id;
    console.log("🏢 [BUSINESS-MANAGER] Récupération abonnement pour user:", userId);
    const result = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:subscription_plans(slug, max_businesses)
      `)
      .eq('user_id', userId)
      .single();
    subscription = result.data;
    subscriptionError = result.error;
  }

  if (subscriptionError) {
    console.error("🏢 [BUSINESS-MANAGER] Erreur récupération abonnement:", subscriptionError);
  }

  console.log("🏢 [BUSINESS-MANAGER] Subscription trouvée:", subscription ? {
    plan: subscription.plan?.slug,
    max_businesses: subscription.plan?.max_businesses
  } : 'null');

  const maxBusinesses = subscription?.plan?.max_businesses ?? 1; // Default starter limit
  console.log("🏢 [BUSINESS-MANAGER] maxBusinesses calculé:", maxBusinesses);

  // Récupérer toutes les entreprises de l'utilisateur
  console.log("🏢 [BUSINESS-MANAGER] Récupération entreprises pour user:", userId);
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
  } else {
    const result = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_user_id', userId)
      .order('created_at', { ascending: false });
    businesses = result.data;
    error = result.error;
  }

  if (error) {
    console.error('🏢 [BUSINESS-MANAGER] Error fetching businesses:', error);
    throw error;
  }

  const businessList = businesses || [];
  console.log("🏢 [BUSINESS-MANAGER] Entreprises trouvées:", businessList.length);
  
  const canCreateMore = maxBusinesses === null || businessList.length < maxBusinesses;
  const remainingSlots = maxBusinesses === null ? null : Math.max(0, maxBusinesses - businessList.length);
  
  console.log("🏢 [BUSINESS-MANAGER] Calcul quotas:", {
    businessListLength: businessList.length,
    maxBusinesses,
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

export async function createBusiness(businessData: Partial<Business>): Promise<Business> {
  // Utiliser le middleware d'authentification
  const auth = await authenticateRequest();
  
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
  const businessManager = await getUserBusinesses();
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
    supabase = await createSupabaseServer();
    clientType = "createSupabaseServer()";
  }
  
  console.log("🔍 [DIAG] Client selected:", clientType);
  
  // Déterminer l'ID utilisateur selon le type d'authentification
  let userId: string;
  if (auth.isTempSession) {
    // Générer le même UUID déterministe basé sur l'email pour les sessions temporaires
    const emailHash = Buffer.from(auth.email).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    const uuid = [
      emailHash.substring(0, 8),
      emailHash.substring(8, 12),
      emailHash.substring(12, 16),
      emailHash.substring(16, 20),
      emailHash.substring(20, 32)
    ].join('-');
    userId = uuid;
  } else {
    userId = auth.user.id; // Pour les sessions Supabase, stocker l'UUID
  }

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
  console.log("🔍 [DIAG] POST-INSERT RESULT:", {
    success: !error,
    error: error ? {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    } : null,
    dataId: data?.id,
    sessionType: auth.isTempSession ? "TEMPORARY" : "SUPABASE",
    clientUsed: clientType,
    owner_user_id: userId
  });

  if (error) {
    console.error('🔍 [DIAG] INSERT FAILED:', error);
    throw error;
  }

  // Définir comme entreprise active si c'est la première
  if (businessManager.businesses.length === 0) {
    await setActiveBusiness(data.id);
  }

  return data;
}

export async function updateBusiness(businessId: string, updates: Partial<Business>): Promise<Business> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('businesses')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', businessId)
    .eq('owner_user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating business:', error);
    throw error;
  }

  return data;
}

export async function deleteBusiness(businessId: string): Promise<void> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Vérifier que c'est bien l'entreprise de l'utilisateur
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('owner_user_id', user.id)
    .single();

  if (!business) {
    throw new Error('Business not found or access denied');
  }

  const { error } = await supabase
    .from('businesses')
    .delete()
    .eq('id', businessId);

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
