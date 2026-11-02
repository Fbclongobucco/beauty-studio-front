import { NextResponse, type NextRequest } from "next/server";

// Com o backend definitivo (NEXT_PUBLIC_API_BASE_URL definido, ex.: na Vercel), a API de teste em memória
// (app/api) não é servida: evita pedidos e logins falsos num endereço público.
const USING_REAL_API = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "") !== "";

// Painel: checagem otimista, só verifica a presença do cookie e redireciona.
// A validação real da sessão acontece na API (definitiva ou de teste).
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return USING_REAL_API
      ? Response.json({ code: "NOT_FOUND", message: "Não encontrado." }, { status: 404 })
      : NextResponse.next();
  }
  if (pathname === "/admin/login") return NextResponse.next();
  if (!request.cookies.has("admin_session")) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = pathname === "/admin" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api", "/api/:path*"],
};
