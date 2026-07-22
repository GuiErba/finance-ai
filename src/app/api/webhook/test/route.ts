import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { processTextWithGemini } from "@/lib/gemini/client";

/**
 * GET /api/webhook/test
 *
 * Endpoint temporário de diagnóstico.
 * Testa cada etapa do pipeline: Supabase, Gemini, e insert.
 * REMOVER APÓS O DEBUG.
 */
export async function GET(request: NextRequest) {
  const results: Record<string, unknown> = {};

  // 1. Testar conexão com Supabase
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.from("transactions").select("id").limit(1);
    results.supabase_connection = error ? `ERRO: ${error.message}` : "OK";
    results.supabase_rows = data?.length ?? 0;
  } catch (err) {
    results.supabase_connection = `EXCEPTION: ${err instanceof Error ? err.message : String(err)}`;
  }

  // 2. Testar busca de user_id
  try {
    const supabase = createServerSupabaseClient();
    const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1 });
    if (usersData?.users && usersData.users.length > 0) {
      results.user_id = usersData.users[0].id;
      results.user_email = usersData.users[0].email;
    } else {
      results.user_id = "NENHUM USUÁRIO ENCONTRADO";
    }
  } catch (err) {
    results.user_id = `EXCEPTION: ${err instanceof Error ? err.message : String(err)}`;
  }

  // 3. Testar Gemini (processar um texto simples)
  try {
    const geminiResult = await processTextWithGemini("R$ 50 Almoço teste");
    results.gemini_status = geminiResult.status;
    results.gemini_transacoes = geminiResult.transacoes?.length ?? 0;
    results.gemini_full = geminiResult;
  } catch (err) {
    results.gemini = `EXCEPTION: ${err instanceof Error ? err.message : String(err)}`;
  }

  // 4. Testar insert completo
  try {
    const supabase = createServerSupabaseClient();
    const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1 });
    const userId = usersData?.users?.[0]?.id;

    if (userId) {
      const { data, error } = await supabase
        .from("transactions")
        .insert({
          data: new Date().toISOString().split("T")[0],
          estabelecimento: "TESTE WEBHOOK DEBUG",
          categoria: "Outros",
          valor: 0.01,
          fonte: "whatsapp_text",
          user_id: userId,
        })
        .select();

      results.insert_test = error ? `ERRO: ${error.message}` : `OK — id: ${data?.[0]?.id}`;
    } else {
      results.insert_test = "SKIPPED — sem user_id";
    }
  } catch (err) {
    results.insert_test = `EXCEPTION: ${err instanceof Error ? err.message : String(err)}`;
  }

  // 5. Checar variáveis de ambiente
  results.env_check = {
    SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    WHATSAPP_VERIFY_TOKEN: !!process.env.WHATSAPP_VERIFY_TOKEN,
    WHATSAPP_ACCESS_TOKEN: !!process.env.WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
  };

  return Response.json(results, { status: 200 });
}
