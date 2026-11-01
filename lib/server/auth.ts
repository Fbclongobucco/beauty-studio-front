import type { NextRequest } from "next/server";
import type { AdminSession } from "@/lib/domain/types";
import { accountIds, accountPassword, MASTER_USER, subForUsername, warnUnknown } from "./accounts";
import { apiError, forbidden } from "./http";
import { repo } from "./repository";

export const SESSION_COOKIE = "admin_session";
export const SESSION_TTL_SECONDS = 12 * 60 * 60;

const enc = new TextEncoder();

function b64url(buf: ArrayBuffer): string {
  return Buffer.from(buf).toString("base64url");
}

/** Chave por conta: trocar a senha de uma conta invalida só as sessões dela. */
async function hmacKey(sub: string, secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(`beauty-studio-session:${sub}:${secret}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function sha256(s: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(s)));
}

/** Comparação em tempo constante (sobre os hashes, para igualar tamanhos). */
async function sameSecret(input: string, expected: string): Promise<boolean> {
  const [a, b] = await Promise.all([sha256(input), sha256(expected)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Contas válidas: master configurado e profissionais de ADMIN_USERS que existem no cadastro. */
async function validAccounts(): Promise<Set<string>> {
  const ids = accountIds();
  const profs = (await repo.listProfessionals()).map((p) => p.id);
  warnUnknown(ids, profs);
  return new Set(ids.filter((id) => id === MASTER_USER || profs.includes(id)));
}

export async function loginEnabled(): Promise<boolean> {
  return (await validAccounts()).size > 0;
}

/** Retorna o id da conta (`sub`) se usuário e senha conferem; null caso contrário. */
export async function authenticate(username: string, password: string): Promise<string | null> {
  const sub = subForUsername(username);
  const ok = !!sub && (await validAccounts()).has(sub);
  const expected = ok ? accountPassword(sub) : null;
  // Usuário inexistente também calcula hash, para não dar pista pelo tempo de resposta.
  const match = await sameSecret(password, expected ?? `\0sem-conta\0${crypto.randomUUID()}`);
  return expected && match ? sub : null;
}

export async function createSessionToken(sub: string, now = Date.now()): Promise<string> {
  const p = accountPassword(sub);
  if (!p) throw new Error(`Conta "${sub}" não configurada`);
  const exp = Math.floor(now / 1000) + SESSION_TTL_SECONDS;
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(sub, p), enc.encode(`${sub}.${exp}`));
  return `${sub}.${exp}.${b64url(sig)}`;
}

/** Retorna o id da conta se o token for válido e não expirado; null caso contrário. */
export async function verifySessionToken(token: string | undefined, now = Date.now()): Promise<string | null> {
  if (!token) return null;
  const [sub, expStr, sig] = token.split(".");
  const exp = Number(expStr);
  if (!sub || !Number.isInteger(exp) || !sig || exp * 1000 < now) return null;
  const p = accountPassword(sub);
  if (!p) return null;
  try {
    const ok = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(sub, p),
      Buffer.from(sig, "base64url"),
      enc.encode(`${sub}.${expStr}`),
    );
    return ok ? sub : null;
  } catch {
    return null;
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

export async function sessionFor(sub: string): Promise<AdminSession | null> {
  if (sub === MASTER_USER) return { role: "master", professionalId: null, name: "" };
  const prof = (await repo.listProfessionals()).find((p) => p.id === sub);
  return prof ? { role: "professional", professionalId: prof.id, name: prof.name } : null;
}

export type SessionResult = { session: AdminSession; denied?: undefined } | { session?: undefined; denied: Response };

/** Sessão da requisição, ou `denied` com 401 se não houver sessão válida. */
export async function getSession(request: NextRequest): Promise<SessionResult> {
  const sub = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const session = sub ? await sessionFor(sub) : null;
  return session ? { session } : { denied: apiError(401, "UNAUTHORIZED", "Faça login para continuar.") };
}

/** 403 se a sessão não for master; null se autorizado. */
export function requireMaster(session: AdminSession): Response | null {
  return session.role === "master" ? null : forbidden();
}

/** Profissional: sempre o próprio id (ignora o pedido). Master: o filtro pedido. */
export function scopeProfessional(session: AdminSession, requested?: string): string | undefined {
  return session.role === "professional" ? session.professionalId! : requested || undefined;
}

/** true se a sessão pode agir sobre um recurso da profissional `ownerId`. */
export function canAccess(session: AdminSession, ownerId: string): boolean {
  return session.role === "master" || session.professionalId === ownerId;
}
