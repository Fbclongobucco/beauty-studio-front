import { NextResponse } from "next/server";
import { createSessionToken, loginEnabled, passwordMatches, sessionCookie } from "@/lib/server/auth";
import { apiError, readJson } from "@/lib/server/http";

export async function POST(request: Request) {
  if (!loginEnabled()) {
    return apiError(503, "LOGIN_DISABLED", "Login desabilitado: configure ADMIN_PASSWORD no servidor.");
  }
  const body = (await readJson(request)) as { password?: unknown } | null;
  const pw = typeof body?.password === "string" ? body.password : "";
  if (!(await passwordMatches(pw))) {
    return apiError(401, "UNAUTHORIZED", "Senha incorreta");
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookie(await createSessionToken()));
  return res;
}
