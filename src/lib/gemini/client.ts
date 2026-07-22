import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GeminiTransactionResponse } from "@/lib/types/database";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: `${SYSTEM_PROMPT}\n\nInput do usuário:\n${text}` }],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

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

  const result = await model.generateContent({
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
  });

  const responseText = result.response.text();
  return JSON.parse(responseText) as GeminiTransactionResponse;
}
