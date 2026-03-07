import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("❌ Configuration Supabase manquante: NEXT_PUBLIC_SUPABASE_URL n'est pas défini. Ajoutez cette variable d'environnement dans votre configuration.");
  }

  if (!supabaseAnonKey) {
    throw new Error("❌ Configuration Supabase manquante: NEXT_PUBLIC_SUPABASE_ANON_KEY n'est pas défini. Ajoutez cette variable d'environnement dans votre configuration.");
  }

  const cookieStore = await cookies();

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // ignore when called from Server Components
          }
        },
      },
    }
  );
}

export async function createSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("🔍 [DIAG] createSupabaseServiceClient called:", {
    hasSupabaseUrl: !!supabaseUrl,
    hasServiceRoleKey: !!serviceRoleKey,
    serviceRoleKeyLength: serviceRoleKey?.length || 0
  });

  if (!supabaseUrl) {
    throw new Error("❌ Configuration Supabase manquante: NEXT_PUBLIC_SUPABASE_URL n'est pas défini. Ajoutez cette variable d'environnement dans votre configuration.");
  }

  if (!serviceRoleKey) {
    console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY non défini, utilisation du client standard pour les sessions temporaires");
    console.log("🔍 [DIAG] FALLBACK TRIGGERED: Using createSupabaseServer() instead of service role");
    return createSupabaseServer();
  }

  console.log("🔍 [DIAG] SUCCESS: Creating service role client with valid keys");
  return createServerClient(
    supabaseUrl,
    serviceRoleKey,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // No-op for service role
        },
      },
    }
  );
}