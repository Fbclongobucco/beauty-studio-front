import { NextResponse } from "next/server";
import { authenticate, createSessionToken, loginEnabled, sessionCookie } from "@/lib/server/auth";
import { apiError, readJson } from "@/lib/server/http";

export async function POST(request: Request) {
  if (!(await loginEnabled())) {
    return apiError(503, "LOGIN_DISABLED", "Login desabilitado: configure ADMIN_PASSWORD ou ADMIN_USERS no servidor.");
  }
  const body = (await readJson(request)) as { username?: unknown; password?: unknown } | null;
  const user = typeof body?.username === "string" ? body.username : "";
  const pw = typeof body?.password === "string" ? body.password : "";
  const sub = await authenticate(user, pw);
  if (!sub) return apiError(401, "UNAUTHORIZED", "Usuário ou senha incorretos");
  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookie(await createSessionToken(sub)));
  return res;
}
