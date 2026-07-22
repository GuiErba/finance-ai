import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Proxy do Next.js 16 (antigo middleware).
 *
 * Responsável por:
 * 1. Renovar a sessão do Supabase em cada requisição (refresh token)
 * 2. Redirecionar usuários não autenticados para /login
 * 3. Redirecionar usuários autenticados que acessem /login para /dashboard
 * 4. Permitir acesso livre ao webhook da API (/api/webhook)
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas que não exigem autenticação
  const publicRoutes = ["/login", "/signup"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isApiRoute = pathname.startsWith("/api/");

  // Cria o response que será retornado (pode ser modificado)
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Inicializa o Supabase client com gerenciamento de cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Atualiza os cookies na request (para server components)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Recria a response para incluir os cookies atualizados
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          // Define os cookies na response (para o browser)
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Renova a sessão (refresh token) em cada requisição
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Rotas de API (webhook) não precisam de autenticação
  if (isApiRoute) {
    return response;
  }

  // Redireciona para /login se o usuário não está autenticado
  // e está tentando acessar uma rota protegida
  if (!user && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redireciona para /dashboard se o usuário já está autenticado
  // e está tentando acessar /login ou /signup
  if (user && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

// Exclui rotas estáticas e de API do proxy para evitar overhead
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
