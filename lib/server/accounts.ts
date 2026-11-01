// Contas do painel:
// - master: usuário em ADMIN_USERNAME (padrão "master"), senha em ADMIN_PASSWORD;
// - profissionais: ADMIN_USERS="stefani:senha1;lorrayne:senha2" (usuário = id da profissional).
//   Cada entrada é dividida no primeiro ":"; a senha pode conter ":", mas não ";";
// - logins criados pelo master no painel: só em memória, somem ao reiniciar o servidor.
//   Conta definida em ADMIN_USERS prevalece e não pode ser alterada pelo painel.

/** Id interno (`sub`) da conta master, independente do nome de login. */
export const MASTER_USER = "master";

/** Nome de login do master (ADMIN_USERNAME, padrão "master"). */
export function masterUsername(): string {
  const u = normalizeUser(process.env.ADMIN_USERNAME ?? "");
  return u || MASTER_USER;
}

/** Id da conta (`sub`) para o usuário digitado no login. */
export function subForUsername(username: string): string {
  const u = normalizeUser(username);
  if (u === masterUsername()) return MASTER_USER;
  // Com o master renomeado, "master" deixa de ser um login válido.
  if (u === MASTER_USER) return "";
  return u;
}

const g = globalThis as typeof globalThis & { __adminMemAccounts?: Map<string, string> };
/** Logins criados pelo painel (id da profissional → senha). Mantido no globalThis por causa do HMR do next dev. */
const memAccounts = (g.__adminMemAccounts ??= new Map<string, string>());

export function setMemoryAccount(professionalId: string, password: string) {
  memAccounts.set(professionalId, password);
}

export function resetMemoryAccounts() {
  memAccounts.clear();
}

/** Origem do login da profissional: ambiente, painel (memória) ou nenhum. */
export function accountSource(professionalId: string): "env" | "memory" | null {
  if (parseUsers(process.env.ADMIN_USERS).has(professionalId)) return "env";
  return memAccounts.has(professionalId) ? "memory" : null;
}

export function normalizeUser(u: string): string {
  return u.trim().toLowerCase();
}

/** Lê ADMIN_USERS. Entradas malformadas (sem ":", usuário ou senha vazios) são ignoradas. */
export function parseUsers(raw: string | undefined): Map<string, string> {
  const out = new Map<string, string>();
  for (const entry of (raw ?? "").split(";")) {
    const i = entry.indexOf(":");
    if (i < 0) continue;
    const user = normalizeUser(entry.slice(0, i));
    const pw = entry.slice(i + 1);
    if (!user || !pw || user === MASTER_USER || user === masterUsername()) continue;
    out.set(user, pw);
  }
  return out;
}

/** Senha configurada para a conta, ou null se a conta não existe no ambiente. */
export function accountPassword(sub: string): string | null {
  if (sub === MASTER_USER) {
    const p = process.env.ADMIN_PASSWORD;
    return p && p.length > 0 ? p : null;
  }
  return parseUsers(process.env.ADMIN_USERS).get(sub) ?? memAccounts.get(sub) ?? null;
}

export function accountIds(): string[] {
  const ids = new Set([...parseUsers(process.env.ADMIN_USERS).keys(), ...memAccounts.keys()]);
  return [...(accountPassword(MASTER_USER) ? [MASTER_USER] : []), ...ids];
}

const warned = new Set<string>();

/** Avisa uma vez por processo sobre ids de ADMIN_USERS sem profissional cadastrada. */
export function warnUnknown(ids: string[], professionalIds: string[]) {
  for (const id of ids) {
    if (id === MASTER_USER || professionalIds.includes(id) || warned.has(id)) continue;
    warned.add(id);
    console.warn(`[admin] ADMIN_USERS: "${id}" não corresponde a nenhuma profissional e foi ignorado.`);
  }
}
