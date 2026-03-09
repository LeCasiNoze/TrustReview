import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase-server";

export type IdentitySource = "supabase" | "none";

export interface RequestIdentity {
  user: any;
  userId: string | null;
  email: string;
  isAuthenticated: boolean;
  source: IdentitySource;
  supabase: SupabaseClient<any, any, any> | null;
}

export async function getSupabaseForIdentity(identity: RequestIdentity): Promise<SupabaseClient<any, any, any>> {
  if (!identity.isAuthenticated) {
    throw new Error("Cannot create Supabase client for unauthenticated identity");
  }

  return identity.supabase ?? await createSupabaseServer();
}

export async function getRequestIdentity(): Promise<RequestIdentity> {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!error && user) {
      return {
        user,
        userId: user.id,
        email: user.email || "",
        isAuthenticated: true,
        source: "supabase",
        supabase,
      };
    }
  } catch (error) {
    console.warn("getRequestIdentity: Supabase auth check failed", error);
  }

  return {
    user: null,
    userId: null,
    email: "",
    isAuthenticated: false,
    source: "none",
    supabase: null,
  };
}
