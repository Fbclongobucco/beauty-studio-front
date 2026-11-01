import type { NextRequest } from "next/server";
import { accountSource, masterUsername, setMemoryAccount } from "@/lib/server/accounts";
import { getSession, requireMaster } from "@/lib/server/auth";
import { json, readJson, validationError } from "@/lib/server/http";
import { repo } from "@/lib/server/repository";

const MIN_PASSWORD = 6;

/** Logins das profissionais (só master). Não devolve senhas. */
export async function GET(request: NextRequest) {
  const { session, denied } = await getSession(request);
  if (denied) return denied;
  const notMaster = requireMaster(session);
  if (notMaster) return notMaster;
  const profs = await repo.listProfessionals();
  return json({
    masterUsername: masterUsername(),
    accounts: profs.map((p) => ({ professionalId: p.id, name: p.name, login: accountSource(p.id) })),
  });
}

/** Cria ou troca a senha do login de uma profissional (só master; fica em memória). */
export async function POST(request: NextRequest) {
  const { session, denied } = await getSession(request);
  if (denied) return denied;
  const notMaster = requireMaster(session);
  if (notMaster) return notMaster;

  const body = (await readJson(request)) as { professionalId?: unknown; password?: unknown } | null;
  const id = typeof body?.professionalId === "string" ? body.professionalId : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const prof = (await repo.listProfessionals()).find((p) => p.id === id);

  if (!prof) return validationError({ professionalId: "Escolha uma profissional cadastrada." });
  if (prof.id === masterUsername()) {
    return validationError({ professionalId: "Esse usuário é o mesmo do master. Altere ADMIN_USERNAME no servidor." });
  }
  if (accountSource(prof.id) === "env") {
    return validationError({ professionalId: "A senha dessa profissional é definida no servidor (ADMIN_USERS)." });
  }
  if (password.length < MIN_PASSWORD || password.length > 100) {
    return validationError({ password: `A senha deve ter pelo menos ${MIN_PASSWORD} caracteres.` });
  }

  setMemoryAccount(prof.id, password);
  return json({ professionalId: prof.id, name: prof.name, login: "memory" as const }, 201);
}
