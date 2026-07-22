/**
 * Serviço de integração com a Meta WhatsApp Cloud API.
 *
 * Responsável por:
 * - Fazer download de arquivos de mídia (áudio, documentos)
 * - Enviar mensagens de confirmação de volta ao usuário
 */

const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";

interface WhatsAppMediaResponse {
  url: string;
  mime_type: string;
  sha256: string;
  file_size: number;
  id: string;
}

/**
 * Obtém a URL de download de um arquivo de mídia (áudio/documento)
 * a partir do media_id recebido no webhook.
 */
export async function getMediaUrl(mediaId: string): Promise<WhatsAppMediaResponse> {
  const response = await fetch(`${WHATSAPP_API_URL}/${mediaId}`, {
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get media URL: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Faz download do binário de um arquivo de mídia da Meta.
 * Retorna o Buffer do arquivo junto com o mime_type.
 */
export async function downloadMedia(
  mediaId: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  const mediaInfo = await getMediaUrl(mediaId);

  const response = await fetch(mediaInfo.url, {
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download media: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType: mediaInfo.mime_type,
  };
}

/**
 * Envia uma mensagem de texto de volta ao usuário no WhatsApp.
 * Usado para confirmar o registro de um gasto.
 */
export async function sendWhatsAppMessage(to: string, message: string): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  const response = await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    }),
  });

  if (!response.ok) {
    console.error("Failed to send WhatsApp message:", await response.text());
  }
}
