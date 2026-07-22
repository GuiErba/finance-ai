import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./_components/DashboardClient";

/**
 * Página principal do Dashboard (Server Component).
 *
 * Busca o usuário autenticado e redireciona para login se não existir.
 * As transações são buscadas aqui no servidor para performance.
 */
export default async function DashboardPage() {
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

  // Busca todas as transações do usuário, ordenadas por data
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .order("data", { ascending: false });

  return (
    <DashboardClient
      userEmail={user.email || ""}
      transactions={transactions || []}
    />
  );
}
