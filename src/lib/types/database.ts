/**
 * Tipagens do banco de dados Supabase.
 *
 * Essas tipagens representam o schema do PostgreSQL no Supabase.
 * Futuramente, podem ser geradas automaticamente via Supabase CLI:
 *   npx supabase gen types typescript --project-id <id> > src/lib/types/database.ts
 */

export type TransactionSource = "whatsapp_text" | "whatsapp_audio" | "fatura_pdf" | "manual";

export type TransactionCategory =
  | "Alimentação"
  | "Transporte"
  | "Combustível"
  | "Lazer"
  | "Saúde"
  | "Assinaturas"
  | "Casa"
  | "Vestuário"
  | "Educação"
  | "Investimento"
  | "Outros";

export interface Transaction {
  id: string;
  user_id: string | null;
  data: string; // ISO date YYYY-MM-DD
  estabelecimento: string;
  categoria: TransactionCategory;
  valor: number;
  fonte: TransactionSource;
  descricao: string | null;
  created_at: string;
}

export interface TransactionInsert {
  data: string;
  estabelecimento: string;
  categoria: string;
  valor: number;
  fonte: TransactionSource;
  descricao?: string | null;
  user_id?: string | null;
}

export interface Investment {
  id: string;
  user_id: string;
  nome: string;
  tipo: string; // ex: "Renda Fixa", "Ações", "FII", "Cripto"
  valor_aportado: number;
  valor_atual: number;
  data_aporte: string;
  notas: string | null;
  created_at: string;
}

/** Estrutura retornada pelo Gemini ao processar texto/áudio/PDF */
export interface GeminiTransactionResponse {
  status: "success" | "error";
  total_processado: number;
  transacoes: {
    data: string;
    estabelecimento: string;
    categoria: string;
    valor: number;
  }[];
  mensagem_erro?: string;
}
