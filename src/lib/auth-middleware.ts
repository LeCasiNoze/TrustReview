import { createSupabaseServer } from "@/lib/supabase-server";
import { getTempSession } from "@/lib/temp-auth";

export interface AuthContext {
  user: any;
  email: string;
  isTempSession: boolean;
  isAuthenticated: boolean;
}

export async function authenticateRequest(): Promise<AuthContext> {
  // Essayer l'authentification Supabase d'abord
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (!error && user) {
      return {
        user,
        email: user.email || '',
        isTempSession: false,
        isAuthenticated: true
      };
    }
  } catch (error) {
    console.log("Supabase auth failed, trying temp session");
  }

  // Essayer la session temporaire
  try {
    const tempSession = await getTempSession();
    
    if (tempSession && tempSession.verified) {
      return {
        user: null, // Pas d'utilisateur Supabase
        email: tempSession.email,
        isTempSession: true,
        isAuthenticated: true
      };
    }
  } catch (error) {
    console.log("Temp session check failed");
  }

  // Aucune authentification
  return {
    user: null,
    email: '',
    isTempSession: false,
    isAuthenticated: false
  };
}

export async function requireAuth(): Promise<AuthContext> {
  const auth = await authenticateRequest();
  
  if (!auth.isAuthenticated) {
    throw new Error("Unauthorized - No valid session found");
  }
  
  return auth;
}
