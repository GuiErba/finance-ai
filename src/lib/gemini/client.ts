import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GeminiTransactionResponse } from "@/lib/types/database";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Helper de retry com backoff exponencial.
 * Tenta até `maxRetries` vezes quando o Gemini retorna 503 (alta demanda).
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const isRetryable =
        error instanceof Error &&
        (error.message.includes("503") ||
          error.message.includes("429") ||
          error.message.includes("high demand") ||
          error.message.includes("RESOURCE_EXHAUSTED"));

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      const delay = baseDelayMs * Math.pow(2, attempt);
      console.warn(
        `[Gemini] Tentativa ${attempt + 1}/${maxRetries} falhou (${error.message}). Retentando em ${delay}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Unreachable");
}

const SYSTEM_PROMPT = `Você é um parser de dados financeiros de alta precisão. Seu objetivo é ler o input fornecido e extrair todas as transações de débito/crédito.

Regras Estritas:
1. Ignore pagamentos de faturas anteriores, foque apenas nos gastos/compras.
2. Se a data não for informada, use a data de hoje: ${new Date().toISOString().split("T")[0]}.
3. Formate a data para o padrão ISO (AAAA-MM-DD).
4. Categorize cada gasto em UMA das seguintes categorias padronizadas: [Alimentação, Transporte, Combustível, Lazer, Saúde, Assinaturas, Casa, Vestuário, Educação, Investimento, Outros].
5. Retorne unicamente o objeto JSON conforme o schema abaixo, sem marcações markdown, sem explicações, APENAS o JSON puro.

JSON Schema de saída:
{
  "status": "success",
  "total_processado": <soma dos valores>,
  "transacoes": [
    {
      "data": "AAAA-MM-DD",
      "estabelecimento": "<nome do estabelecimento>",
      "categoria": "<uma das categorias acima>",
      "valor": <número decimal>
    }
  ]
}

Se não conseguir extrair nenhuma transação, retorne:
{
  "status": "error",
  "total_processado": 0,
  "transacoes": [],
  "mensagem_erro": "<motivo>"
}`;

/**
 * Processa uma mensagem de texto avulsa enviada pelo WhatsApp.
 * Ex: "iFood R$ 65" → extrai a transação.
 */
export async function processTextWithGemini(
  text: string
): Promise<GeminiTransactionResponse> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const result = await withRetry(() =>
    model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: `${SYSTEM_PROMPT}\n\nInput do usuário:\n${text}` }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    })
  );

  const responseText = result.response.text();
  return JSON.parse(responseText) as GeminiTransactionResponse;
}

/**
 * Processa um áudio enviado pelo WhatsApp.
 * O Gemini possui suporte nativo multimodal para áudio.
 */
export async function processAudioWithGemini(
  audioBuffer: Buffer,
  mimeType: string
): Promise<GeminiTransactionResponse> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const audioBase64 = audioBuffer.toString("base64");

  const result = await withRetry(() =>
    model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: audioBase64,
              },
            },
            {
              text: `${SYSTEM_PROMPT}\n\nO áudio acima contém informações sobre gastos financeiros. Extraia todas as transações mencionadas.`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    })
  );

  const responseText = result.response.text();
  return JSON.parse(responseText) as GeminiTransactionResponse;
}
