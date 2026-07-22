"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GeminiTransactionResponse, TransactionInsert } from "@/lib/types/database";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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

export type UploadInvoiceState = {
  success?: boolean;
  message?: string;
  savedCount?: number;
} | undefined;

/**
 * Server Action: Processa o upload de uma fatura em PDF
 */
export async function uploadInvoice(
  _prevState: UploadInvoiceState,
  formData: FormData
): Promise<UploadInvoiceState> {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Usuário não autenticado." };
  }

  const file = formData.get("invoice") as File;
  const year = formData.get("year") as string;

  if (!file || file.type !== "application/pdf") {
    return { success: false, message: "Por favor, envie um arquivo PDF válido." };
  }

  if (!year) {
    return { success: false, message: "Por favor, selecione o ano da fatura." };
  }

  try {
    // 1. Buscar TODAS as transações do usuário para a conciliação
    // Usamos todo o histórico para garantir que faturas antigas (ex: 2024)
    // sejam deduplicadas corretamente caso a transação já exista.
    const { data: existingTransactions, error: fetchError } = await supabase
      .from("transactions")
      .select("data, estabelecimento, valor, fonte")
      .eq("user_id", user.id);

    if (fetchError) {
      console.error("Erro ao buscar transações existentes:", fetchError);
      return { success: false, message: "Erro ao consultar histórico." };
    }

    // 2. Preparar o PDF para o Gemini
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfBase64 = buffer.toString("base64");

    // 3. Construir o Prompt Robusto de Conciliação
    const SYSTEM_PROMPT = `Você é um analista financeiro de dados e especialista em conciliação bancária.
Sua tarefa é extrair as transações (compras/gastos) da fatura de cartão de crédito em PDF anexada.

CRÍTICO - DEDUPLICAÇÃO DE DADOS:
O usuário já envia gastos diários via WhatsApp. Abaixo, eu forneço um array JSON chamado "transacoes_existentes" que contém o que JÁ ESTÁ no banco de dados.
Você DEVE comparar cada gasto da fatura com essa lista. Se um gasto da fatura for a MESMA COMPRA que já existe no banco, você DEVE IGNORÁ-LA e NÃO incluí-la na resposta final.

Regras de Fuzzy Matching para detectar duplicatas:
1. VALOR: O valor é o maior indicador. Se o valor bater exato, há altíssima chance de ser a mesma compra.
2. DATA: As datas podem ter variação de 1 a 3 dias (ex: compra no fim de semana só entra na fatura na terça-feira).
3. NOME: O nome na fatura costuma ser técnico (ex: "PGTO*IFOOD", "MP*MERCADOLIVRE") enquanto o usuário pode ter cadastrado "Lanche" ou "Compra online". Baseie a deduplicação fortemente no VALOR e na proximidade da DATA.

Regras de Extração:
1. Extraia apenas gastos (débitos). Ignore pagamentos da própria fatura (créditos) ou taxas de juros/multas menores, a menos que sejam tarifas bancárias claras.
2. Formate a data para ISO (AAAA-MM-DD). O usuário informou que as compras desta fatura ocorreram no ano de ${year}. SE A FATURA SÓ TROUXER DIA E MÊS, VOCÊ DEVE OBRIGATORIAMENTE USAR O ANO ${year}.
3. Categorize os novos gastos em UMA das seguintes: [Alimentação, Transporte, Combustível, Lazer, Saúde, Assinaturas, Casa, Vestuário, Educação, Investimento, Outros].

Retorne APENAS um objeto JSON com as transações NOVAS (não duplicadas) que você encontrou na fatura. Nenhuma formatação markdown, apenas o JSON.

Schema JSON exigido:
{
  "status": "success",
  "total_processado": <soma dos valores das transações NOVAS que serão inseridas>,
  "transacoes": [
    {
      "data": "AAAA-MM-DD",
      "estabelecimento": "<nome do estabelecimento formatado sem caracteres especiais como *>",
      "categoria": "<uma das categorias permitidas>",
      "valor": <número decimal>
    }
  ]
}

Se TODAS as transações do PDF já existirem no banco, retorne um array vazio em "transacoes".

Transações já existentes no banco (para conciliação):
${JSON.stringify(existingTransactions, null, 2)}`;

    // 4. Enviar para o Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: SYSTEM_PROMPT },
            {
              inlineData: {
                mimeType: "application/pdf",
                data: pdfBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const responseText = result.response.text();
    const parsedResponse = JSON.parse(responseText) as GeminiTransactionResponse;

    if (parsedResponse.status !== "success" || !parsedResponse.transacoes || parsedResponse.transacoes.length === 0) {
      return { 
        success: true, 
        message: "O Gemini analisou a fatura. Não foram encontradas transações NOVAS (todas já estavam cadastradas ou o arquivo não contém gastos).",
        savedCount: 0 
      };
    }

    // 5. Inserir as novas transações no banco
    const rows: TransactionInsert[] = parsedResponse.transacoes.map((t) => ({
      data: t.data,
      estabelecimento: t.estabelecimento,
      categoria: t.categoria,
      valor: t.valor,
      fonte: "fatura_pdf",
      user_id: user.id
    }));

    const { error: insertError } = await supabase.from("transactions").insert(rows);

    if (insertError) {
      console.error("Erro ao inserir transações da fatura:", insertError);
      return { success: false, message: `Erro ao salvar: ${insertError.message}` };
    }

    // Revalida a rota do dashboard para que a tabela seja atualizada com as novas transações
    revalidatePath("/dashboard");

    return { 
      success: true, 
      message: `Sucesso! ${rows.length} transações novas foram registradas.`,
      savedCount: rows.length 
    };

  } catch (error) {
    console.error("Erro no processamento da fatura:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Erro ao processar: ${errorMessage}` };
  }
}
