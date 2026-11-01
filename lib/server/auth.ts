import type { NextRequest } from "next/server";
import { apiError } from "./http";

export const SESSION_COOKIE = "admin_session";
export const SESSION_TTL_SECONDS = 12 * 60 * 60;

const enc = new TextEncoder();

function password(): string | null {
  const p = process.env.ADMIN_PASSWORD;
  return p && p.length > 0 ? p : null;
}

function b64url(buf: ArrayBuffer): string {
  return Buffer.from(buf).toString("base64url");
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", enc.encode(`beauty-studio-session:${secret}`), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

async function sha256(s: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(s)));
}

/** Comparação em tempo constante (sobre os hashes, para igualar tamanhos). */
export async function passwordMatches(input: string): Promise<boolean> {
  const p = password();
  if (!p) return false;
  const [a, b] = await Promise.all([sha256(input), sha256(p)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function loginEnabled(): boolean {
  return password() !== null;
}

export async function createSessionToken(now = Date.now()): Promise<string> {
  const p = password();
  if (!p) throw new Error("ADMIN_PASSWORD não configurada");
  const exp = Math.floor(now / 1000) + SESSION_TTL_SECONDS;
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(p), enc.encode(String(exp)));
  return `${exp}.${b64url(sig)}`;
}

export async function verifySessionToken(token: string | undefined, now = Date.now()): Promise<boolean> {
  const p = password();
  if (!p || !token) return false;
  const [expStr, sig] = token.split(".");
  const exp = Number(expStr);
  if (!Number.isInteger(exp) || !sig || exp * 1000 < now) return false;
  try {
    return await crypto.subtle.verify("HMAC", await hmacKey(p), Buffer.from(sig, "base64url"), enc.encode(expStr));
  } catch {
    return false;
  }
}

export function sessionCookie(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

/** Retorna uma Response 401 se não houver sessão válida; null se autorizado. */
export async function requireAdmin(request: NextRequest): Promise<Response | null> {
  const ok = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  return ok ? null : apiError(401, "UNAUTHORIZED", "Faça login para continuar.");
}

if (!password()) {
  console.warn("[admin] ADMIN_PASSWORD não configurada: login do painel desabilitado.");
}
