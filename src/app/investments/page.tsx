import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import InvestmentsClient from "./_components/InvestmentsClient";

/**
 * Página de Investimentos (Server Component).
 *
 * Busca os investimentos do usuário autenticado e passa
 * para o componente client que renderiza a UI interativa.
 */
export default async function InvestmentsPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Não precisamos setar cookies nessa leitura
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: investments } = await supabase
    .from("investments")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <InvestmentsClient
      userEmail={user.email || ""}
      investments={investments || []}
    />
  );
}
