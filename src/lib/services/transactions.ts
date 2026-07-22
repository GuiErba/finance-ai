import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { TransactionInsert, GeminiTransactionResponse, TransactionSource } from "@/lib/types/database";

/**
 * Salva as transações processadas pela IA no banco de dados Supabase.
 * Futuramente, esta função também espelhará os dados no Google Sheets.
 */
export async function persistTransactions(
  geminiResponse: GeminiTransactionResponse,
  fonte: TransactionSource
): Promise<{ saved: number; errors: string[] }> {
  if (geminiResponse.status !== "success" || geminiResponse.transacoes.length === 0) {
    return { saved: 0, errors: [geminiResponse.mensagem_erro || "Nenhuma transação encontrada."] };
  }

  const supabase = createServerSupabaseClient();
  const errors: string[] = [];
  let saved = 0;

  // Busca o user_id do primeiro usuário do sistema.
  // Como esta é uma aplicação single-user, sempre haverá apenas um usuário.
  // O webhook não tem contexto de sessão, então precisamos buscar explicitamente.
  let userId: string | null = null;
  try {
    const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1 });
    if (usersData?.users && usersData.users.length > 0) {
      userId = usersData.users[0].id;
    }
  } catch (err) {
    console.error("[persistTransactions] Erro ao buscar user_id:", err);
  }

  if (!userId) {
    return { saved: 0, errors: ["Nenhum usuário encontrado no sistema. Crie uma conta no Dashboard primeiro."] };
  }

  // Mapeia as transações do Gemini para o formato do banco
  const rows: TransactionInsert[] = geminiResponse.transacoes.map((t) => ({
    data: t.data,
    estabelecimento: t.estabelecimento,
    categoria: t.categoria,
    valor: t.valor,
    fonte,
    user_id: userId,
  }));

  // Insere todas as transações de uma vez (batch insert)
  const { data, error } = await supabase
    .from("transactions")
    .insert(rows)
    .select();

  if (error) {
    console.error("Erro ao salvar transações no Supabase:", error);
    errors.push(`Supabase error: ${error.message}`);
  } else {
    saved = data?.length || 0;
  }

  // TODO: Espelhar no Google Sheets (Fase 3+)
  // await appendTransactionsToSheet(rows);

  return { saved, errors };
}

