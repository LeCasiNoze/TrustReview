import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServer, createSupabaseServiceClient } from "@/lib/supabase-server";
import { getTempSession, clearTempSession } from "@/lib/temp-auth";
import { getTemporaryUserId } from "@/lib/temp-uuid";

export type IdentitySource = "supabase" | "temp" | "none";

export interface RequestIdentity {
  user: any;
  userId: string | null;
  email: string;
  isAuthenticated: boolean;
  isTempSession: boolean;
  source: IdentitySource;
  supabase: SupabaseClient<any, any, any> | null;
}

export async function getSupabaseForIdentity(identity: RequestIdentity): Promise<SupabaseClient<any, any, any>> {
  if (!identity.isAuthenticated) {
    throw new Error("Cannot create Supabase client for unauthenticated identity");
  }

  if (identity.isTempSession) {
    return createSupabaseServiceClient();
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
      await clearTempSession();
      return {
        user,
        userId: user.id,
        email: user.email || "",
        isAuthenticated: true,
        isTempSession: false,
        source: "supabase",
        supabase,
      };
    }
  } catch (error) {
    console.warn("getRequestIdentity: Supabase auth check failed", error);
  }

  try {
    const tempSession = await getTempSession();

    if (tempSession?.verified) {
      return {
        user: null,
        userId: getTemporaryUserId(tempSession.email),
        email: tempSession.email,
        isAuthenticated: true,
        isTempSession: true,
        source: "temp",
        supabase: null,
      };
    }
  } catch (error) {
    console.warn("getRequestIdentity: Temp session lookup failed", error);
  }

  return {
    user: null,
    userId: null,
    email: "",
    isAuthenticated: false,
    isTempSession: false,
    source: "none",
    supabase: null,
  };
}
