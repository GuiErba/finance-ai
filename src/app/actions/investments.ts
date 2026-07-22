"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

/**
 * Cria o cliente Supabase server-side
 */
async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() { /* readonly here */ },
      },
    }
  );
}

export type InvestmentFormState = {
  success?: boolean;
  message?: string;
} | undefined;

/**
 * Server Action: Criar um novo investimento
 */
export async function createInvestment(
  _prevState: InvestmentFormState,
  formData: FormData
): Promise<InvestmentFormState> {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Usuário não autenticado." };
  }

  const nome = formData.get("nome") as string;
  const tipo = formData.get("tipo") as string;
  const valor_aportado = parseFloat(formData.get("valor_aportado") as string);
  const valor_atual = parseFloat(formData.get("valor_atual") as string);
  const data_aporte = formData.get("data_aporte") as string;
  const notas = (formData.get("notas") as string) || null;

  if (!nome || !tipo || isNaN(valor_aportado) || isNaN(valor_atual) || !data_aporte) {
    return { success: false, message: "Preencha todos os campos obrigatórios." };
  }

  const { error } = await supabase.from("investments").insert({
    user_id: user.id,
    nome,
    tipo,
    valor_aportado,
    valor_atual,
    data_aporte,
    notas,
  });

  if (error) {
    console.error("Erro ao criar investimento:", error);
    return { success: false, message: `Erro ao salvar: ${error.message}` };
  }

  revalidatePath("/investments");
  return { success: true, message: "Investimento registrado com sucesso!" };
}

/**
 * Server Action: Atualizar o valor atual de um investimento
 */
export async function updateInvestment(
  _prevState: InvestmentFormState,
  formData: FormData
): Promise<InvestmentFormState> {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Usuário não autenticado." };
  }

  const id = formData.get("id") as string;
  const valor_atual = parseFloat(formData.get("valor_atual") as string);

  if (!id || isNaN(valor_atual)) {
    return { success: false, message: "Dados inválidos." };
  }

  const { error } = await supabase
    .from("investments")
    .update({ valor_atual })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Erro ao atualizar investimento:", error);
    return { success: false, message: `Erro ao atualizar: ${error.message}` };
  }

  revalidatePath("/investments");
  return { success: true, message: "Valor atualizado!" };
}

/**
 * Server Action: Deletar um investimento
 */
export async function deleteInvestment(
  _prevState: InvestmentFormState,
  formData: FormData
): Promise<InvestmentFormState> {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Usuário não autenticado." };
  }

  const id = formData.get("id") as string;

  if (!id) {
    return { success: false, message: "ID do investimento não informado." };
  }

  const { error } = await supabase
    .from("investments")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Erro ao deletar investimento:", error);
    return { success: false, message: `Erro ao deletar: ${error.message}` };
  }

  revalidatePath("/investments");
  return { success: true, message: "Investimento removido." };
}
