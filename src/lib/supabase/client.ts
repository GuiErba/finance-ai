import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso no browser (Client Components).
 *
 * Utiliza a ANON_KEY que respeita o Row Level Security (RLS),
 * garantindo que cada usuário só acesse seus próprios dados.
 *
 * Este cliente é usado nos componentes "use client" do Dashboard.
 */
export function createBrowserSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
