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

  // Mapeia as transações do Gemini para o formato do banco
  const rows: TransactionInsert[] = geminiResponse.transacoes.map((t) => ({
    data: t.data,
    estabelecimento: t.estabelecimento,
    categoria: t.categoria,
    valor: t.valor,
    fonte,
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
