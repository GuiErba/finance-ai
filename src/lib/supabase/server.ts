import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase para uso em Server Components, Route Handlers e Server Actions.
 *
 * Utiliza a SERVICE_ROLE_KEY que ignora o Row Level Security (RLS),
 * permitindo operações administrativas como o webhook do WhatsApp
 * (que não possui contexto de usuário autenticado).
 *
 * ⚠️ NUNCA exponha este cliente ao browser (não use em "use client").
 */
let serverClient: SupabaseClient | null = null;

export function createServerSupabaseClient(): SupabaseClient {
  if (serverClient) return serverClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables."
    );
  }

  serverClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serverClient;
}
