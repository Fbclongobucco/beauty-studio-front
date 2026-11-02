import type { Appointment } from "@/lib/domain/types";

/**
 * Cookie `my_requests` da API de teste: os pedidos feitos ou abertos neste aparelho, assinados pelo servidor.
 * Mesmo contrato do backend definitivo: só ids (até 10, mais recente primeiro), HttpOnly,
 * caminho /api/appointments, 60 dias. Valor inválido conta como vazio.
 */
export const MY_REQUESTS_COOKIE = "my_requests";
export const MY_REQUESTS_MAX = 10;
const TTL_SECONDS = 60 * 24 * 60 * 60;
const PATH = "/api/appointments";

const enc = new TextEncoder();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Chave aleatória por processo: some ao reiniciar, junto com os pedidos em memória.
const g = globalThis as typeof globalThis & { __lbMyRequestsKey?: Promise<CryptoKey> };
function key(): Promise<CryptoKey> {
  g.__lbMyRequestsKey ??= crypto.subtle.importKey(
    "raw",
    crypto.getRandomValues(new Uint8Array(32)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  return g.__lbMyRequestsKey;
}

export async function encodeMyRequests(ids: string[], now = Date.now()): Promise<string> {
  const payload = Buffer.from(JSON.stringify({ ids, exp: Math.floor(now / 1000) + TTL_SECONDS })).toString("base64url");
  const sig = await crypto.subtle.sign("HMAC", await key(), enc.encode(`my-requests:${payload}`));
  return `${payload}.${Buffer.from(sig).toString("base64url")}`;
}

export async function decodeMyRequests(token: string | undefined, now = Date.now()): Promise<string[]> {
  if (!token) return [];
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return [];
  try {
    const ok = await crypto.subtle.verify(
      "HMAC",
      await key(),
      Buffer.from(sig, "base64url"),
      enc.encode(`my-requests:${payload}`),
    );
    if (!ok) return [];
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { ids?: unknown; exp?: unknown };
    if (typeof data.exp !== "number" || data.exp * 1000 < now || !Array.isArray(data.ids)) return [];
    return data.ids.filter((i): i is string => typeof i === "string" && UUID_RE.test(i)).slice(0, MY_REQUESTS_MAX);
  } catch {
    return [];
  }
}

/** Põe o pedido no início, sem repetir; acima de 10, o mais antigo sai. */
export function withFirst(ids: string[], id: string): string[] {
  return [id, ...ids.filter((i) => i !== id)].slice(0, MY_REQUESTS_MAX);
}

/** Pendente; confirmado que não terminou; recusado ou cancelado com início no futuro. */
export function isInProgress(a: Appointment, now = Date.now()): boolean {
  if (a.status === "pending") return true;
  if (a.status === "confirmed") return Date.parse(a.endISO) > now;
  return Date.parse(a.startISO) > now;
}

/** Valor do cabeçalho Set-Cookie; lista vazia apaga o cookie. */
export async function myRequestsSetCookie(ids: string[], now = Date.now()): Promise<string> {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  if (ids.length === 0) return `${MY_REQUESTS_COOKIE}=; Path=${PATH}; Max-Age=0; HttpOnly; SameSite=Lax${secure}`;
  const value = await encodeMyRequests(ids, now);
  return `${MY_REQUESTS_COOKIE}=${value}; Path=${PATH}; Max-Age=${TTL_SECONDS}; HttpOnly; SameSite=Lax${secure}`;
}

export function readMyRequestsCookie(request: Request): string | undefined {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === MY_REQUESTS_COOKIE) return rest.join("=");
  }
  return undefined;
}
