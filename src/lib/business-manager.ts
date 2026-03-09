import { createSupabaseServer } from "@/lib/supabase-server";
import type { RequestIdentity } from "@/lib/request-identity";
import { getRequestIdentity } from "@/lib/request-identity";
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
  console.log("🏢 [BUSINESS-MANAGER] getUserBusinesses appelé");
  
  const auth = identity ?? await getRequestIdentity();
  
  if (!auth.isAuthenticated || !auth.userId) {
    throw new Error('User not authenticated');
  }
  
  // Uniquement Supabase - plus de sessions temporaires
  const supabase = auth.supabase ?? await createSupabaseServer();
  const userId = auth.userId;
  
  console.log("🏢 [BUSINESS-MANAGER] Auth result:", {
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
    console.error("🏢 [BUSINESS-MANAGER] Erreur récupération abonnement:", subscriptionError);
  }

  console.log("🏢 [BUSINESS-MANAGER] Subscription trouvée:", subscription ? {
    plan: subscription.plan?.slug
  } : 'null');

  // Utiliser la source de vérité unique pour les quotas
  const planQuotas = getPlanQuotas(subscription?.plan?.slug);
  console.log("🏢 [BUSINESS-MANAGER] Plan quotas utilisés:", planQuotas);

  // Récupérer toutes les entreprises de l'utilisateur
  console.log("🔍 [BUSINESS-CHECK-DEBUG] QUOTA CHECK:", {
    sessionType: "SUPABASE",
    clientType: "createSupabaseServer()",
    userId: userId,
    email: auth.email,
    requete: `SELECT * FROM businesses WHERE owner_user_id = '${userId}'`
  });
  
  let businesses, error;
  
  const { data: businessesData, error: businessesError } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_user_id', userId)
    .order('created_at', { ascending: false });
    
  businesses = businessesData;
  error = businessesError;

  if (error) {
    console.error("🏢 [BUSINESS-MANAGER] Erreur récupération entreprises:", error);
    throw error;
  }

  console.log("🏢 [BUSINESS-MANAGER] Entreprises trouvées:", businesses?.length || 0);

  // Calculer les quotas restants
  const remainingQuotas = calculateRemainingQuotas(
    subscription?.plan?.slug,
    businesses?.length || 0,
    0 // QR codes non pertinents ici
  );

  console.log("🏢 [BUSINESS-MANAGER] Quotas calculés:", remainingQuotas);

  // Définir comme entreprise active si c'est la première (source de vérité unique)
  if (businesses && businesses.length === 0) {
    await setFirstBusinessAsActive(userId, false);
  }

  return {
    businesses: businesses || [],
    activeBusiness: businesses?.find(b => b.is_active) || null,
    canCreateMore: remainingQuotas.canCreateBusiness,
    remainingSlots: remainingQuotas.remainingBusinesses
  };
}

export async function createBusiness(
  businessData: Omit<Business, 'id' | 'created_at' | 'updated_at' | 'owner_user_id'>,
  identity?: RequestIdentity
): Promise<Business> {
  const auth = identity ?? await getRequestIdentity();
  
  if (!auth.isAuthenticated || !auth.userId) {
    throw new Error('User not authenticated');
  }
  
  // Uniquement Supabase - plus de sessions temporaires
  const supabase = auth.supabase ?? await createSupabaseServer();
  const userId = auth.userId;

  // Vérifier les quotas
  const businessesManager = await getUserBusinesses(auth);
  
  if (!businessesManager.canCreateMore) {
    throw new Error(`Limite d'entreprises atteinte (${businessesManager.remainingSlots || 0} restantes)`);
  }

  // LOGS DIAGNOSTIC - Étape 1: Type de session
  console.log("🔍 [DIAG] Session type detected:", {
    isAuthenticated: auth.isAuthenticated,
    email: auth.email,
    hasUser: !!auth.user,
    userId: auth.user?.id
  });

  // LOGS DIAGNOSTIC - Étape 2: Client Supabase
  let clientType: string;
  let supabaseClient;
  
  supabaseClient = supabase;
  clientType = "createSupabaseServer()";
  
  // LOGS DIAGNOSTIC - Étape 3: ID utilisateur
  console.log("🔍 [DIAG] User ID resolution:", {
    resolvedUserId: userId,
    source: "auth.userId"
  });
  
  // LOGS DIAGNOSTIC - Étape 4: Juste avant l'insert
  console.log("🔍 [DIAG] PRE-INSERT ANALYSIS:", {
    sessionType: "SUPABASE",
    clientUsed: clientType,
    owner_user_id: userId,
    serviceRoleKeyPresent: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    willUseServiceRole: false
  });

  const { data, error } = await supabaseClient
    .from('businesses')
    .insert({
      ...businessData,
      owner_user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error("🔍 [DIAG] INSERT ERROR:", {
      error,
      errorMessage: error.message,
      errorDetails: error.details,
      errorHint: error.hint,
      errorCode: error.code
    });
    throw error;
  }

  console.log("🔍 [DIAG] INSERT SUCCESS:", {
    businessId: data.id,
    businessName: data.name,
    owner_user_id: data.owner_user_id,
    sessionType: "SUPABASE",
    clientUsed: clientType,
    owner_user_id_utilisé: userId
  });

  // Définir comme entreprise active si c'est la première (source de vérité unique)
  if (businessesManager.businesses.length === 0) {
    await setFirstBusinessAsActive(userId, false);
  }

  return data;
}

export async function updateBusiness(
  businessId: string,
  businessData: Partial<Omit<Business, 'id' | 'created_at' | 'updated_at' | 'owner_user_id'>>,
  identity?: RequestIdentity
): Promise<Business> {
  const auth = identity ?? await getRequestIdentity();
  
  if (!auth.isAuthenticated || !auth.userId) {
    throw new Error('User not authenticated');
  }
  
  const supabase = auth.supabase ?? await createSupabaseServer();

  const { data, error } = await supabase
    .from('businesses')
    .update({
      ...businessData,
      updated_at: new Date().toISOString()
    })
    .eq('id', businessId)
    .eq('owner_user_id', auth.userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteBusiness(
  businessId: string,
  identity?: RequestIdentity
): Promise<void> {
  const auth = identity ?? await getRequestIdentity();
  
  if (!auth.isAuthenticated || !auth.userId) {
    throw new Error('User not authenticated');
  }
  
  const supabase = auth.supabase ?? await createSupabaseServer();

  const { error } = await supabase
    .from('businesses')
    .delete()
    .eq('id', businessId)
    .eq('owner_user_id', auth.userId);

  if (error) {
    throw error;
  }
}
