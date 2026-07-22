import { NextRequest } from "next/server";
import { processTextWithGemini, processAudioWithGemini } from "@/lib/gemini/client";
import { downloadMedia, sendWhatsAppMessage } from "@/lib/whatsapp/service";
import { persistTransactions } from "@/lib/services/transactions";

/**
 * GET /api/webhook
 *
 * Verificação do Webhook pela Meta (Challenge-Response).
 * A Meta envia um GET com hub.mode, hub.verify_token e hub.challenge.
 * Se o token bater com o nosso, retornamos o challenge para confirmar.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("[Webhook] ✅ Verificação bem-sucedida.");
    return new Response(challenge, { status: 200 });
  }

  console.warn("[Webhook] ❌ Verificação falhou — token inválido.");
  return new Response("Forbidden", { status: 403 });
}

/**
 * POST /api/webhook
 *
 * Recebe notificações do WhatsApp Cloud API.
 * Processa mensagens de texto e áudio, extrai transações via Gemini
 * e persiste no Supabase.
 *
 * Retorna 200 imediatamente para evitar retries da Meta.
 * O processamento pesado roda via waitUntil().
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Validação básica: ignora payloads que não sejam mensagens
  const entry = body?.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  const message = value?.messages?.[0];

  if (!message) {
    // Pode ser uma notificação de status (delivered, read, etc.) — ignorar
    return new Response("OK", { status: 200 });
  }

  const senderPhone = message.from;

  // Processa a mensagem em background sem bloquear a resposta HTTP
  const processingPromise = handleIncomingMessage(message, senderPhone);

  // waitUntil mantém a função viva após o retorno do 200 OK,
  // permitindo que o Gemini processe sem ser abortado pela Vercel.
  // @ts-expect-error — waitUntil está disponível no runtime da Vercel
  if (typeof request.waitUntil === "function") {
    // @ts-expect-error
    request.waitUntil(processingPromise);
  } else {
    // Fallback para desenvolvimento local: aguarda a promise
    processingPromise.catch((err) =>
      console.error("[Webhook] Erro no processamento:", err)
    );
  }

  return new Response("OK", { status: 200 });
}

/**
 * Orquestra o processamento de uma mensagem recebida.
 */
async function handleIncomingMessage(
  message: Record<string, unknown>,
  senderPhone: string
): Promise<void> {
  try {
    const messageType = message.type as string;

    if (messageType === "text") {
      await handleTextMessage(message, senderPhone);
    } else if (messageType === "audio") {
      await handleAudioMessage(message, senderPhone);
    } else {
      console.log(`[Webhook] Tipo de mensagem não suportado: ${messageType}`);
    }
  } catch (error) {
    console.error("[Webhook] Erro no processamento:", error);
    await sendWhatsAppMessage(
      senderPhone,
      "❌ Ocorreu um erro ao processar sua mensagem. Tente novamente."
    ).catch(() => {}); // Não propagar erros do envio de feedback
  }
}

/**
 * Processa uma mensagem de texto:
 * 1. Envia o texto para o Gemini
 * 2. Salva as transações no Supabase
 * 3. Envia confirmação ao usuário
 */
async function handleTextMessage(
  message: Record<string, unknown>,
  senderPhone: string
): Promise<void> {
  const textBody = (message.text as Record<string, unknown>)?.body as string;

  if (!textBody) {
    console.warn("[Webhook] Mensagem de texto vazia recebida.");
    return;
  }

  console.log(`[Webhook] 📝 Texto recebido: "${textBody}"`);

  const geminiResult = await processTextWithGemini(textBody);
  const { saved, errors } = await persistTransactions(geminiResult, "whatsapp_text");

  if (saved > 0) {
    const total = geminiResult.total_processado.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    await sendWhatsAppMessage(
      senderPhone,
      `✅ ${saved} transação(ões) registrada(s)!\nTotal: ${total}`
    );
  } else {
    const errorMsg = errors.length > 0 ? errors.join("; ") : "Não foi possível extrair gastos.";
    await sendWhatsAppMessage(senderPhone, `⚠️ ${errorMsg}`);
  }
}

/**
 * Processa uma mensagem de áudio:
 * 1. Faz download do áudio da Meta
 * 2. Envia para o Gemini (multimodal)
 * 3. Salva as transações no Supabase
 * 4. Envia confirmação ao usuário
 */
async function handleAudioMessage(
  message: Record<string, unknown>,
  senderPhone: string
): Promise<void> {
  const audio = message.audio as Record<string, unknown>;
  const mediaId = audio?.id as string;

  if (!mediaId) {
    console.warn("[Webhook] Mensagem de áudio sem media_id.");
    return;
  }

  console.log(`[Webhook] 🎤 Áudio recebido — media_id: ${mediaId}`);

  // Download do áudio da Meta
  const { buffer, mimeType } = await downloadMedia(mediaId);

  // Processa com Gemini (suporte nativo multimodal a áudio)
  const geminiResult = await processAudioWithGemini(buffer, mimeType);
  const { saved, errors } = await persistTransactions(geminiResult, "whatsapp_audio");

  if (saved > 0) {
    const total = geminiResult.total_processado.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    await sendWhatsAppMessage(
      senderPhone,
      `✅ ${saved} transação(ões) registrada(s) via áudio!\nTotal: ${total}`
    );
  } else {
    const errorMsg = errors.length > 0 ? errors.join("; ") : "Não entendi o áudio. Tente novamente.";
    await sendWhatsAppMessage(senderPhone, `⚠️ ${errorMsg}`);
  }
}
