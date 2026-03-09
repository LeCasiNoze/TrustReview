import type { SupabaseClient } from "@supabase/supabase-js";
import { getRequestIdentity } from "@/lib/request-identity";

export interface AuthContext {
  user: any;
  email: string;
  userId: string | null;
  isAuthenticated: boolean;
  source: "supabase" | "none";
  supabase?: SupabaseClient<any, any, any> | null;
}

export async function authenticateRequest(): Promise<AuthContext> {
  return getRequestIdentity();
}

export async function requireAuth(): Promise<AuthContext> {
  const auth = await authenticateRequest();
  
  if (!auth.isAuthenticated) {
    throw new Error("Unauthorized - No valid session found");
  }
  
  return auth;
}
