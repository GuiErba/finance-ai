import { redirect } from "next/navigation";

/**
 * Página raiz — redireciona para /dashboard.
 * O proxy.ts cuidará de enviar para /login se não estiver autenticado.
 */
export default function Home() {
  redirect("/dashboard");
}
