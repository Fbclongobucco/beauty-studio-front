import type { NextRequest } from "next/server";
import { getSession, requireMaster } from "@/lib/server/auth";
import { json, readJson, validationError } from "@/lib/server/http";
import { repo } from "@/lib/server/repository";

export async function GET(request: NextRequest) {
  const { session, denied } = await getSession(request);
  if (denied) return denied;
  const all = await repo.listProfessionals();
  return json({ professionals: session.role === "master" ? all : all.filter((p) => p.id === session.professionalId) });
}

export async function POST(request: NextRequest) {
  const { session, denied } = await getSession(request);
  if (denied) return denied;
  const notMaster = requireMaster(session);
  if (notMaster) return notMaster;
  const body = (await readJson(request)) as { name?: unknown } | null;
  const name = typeof body?.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
  if (name.length < 2 || name.length > 60) return validationError({ name: "Informe o nome da profissional." });
  return json(await repo.createProfessional(name), 201);
}
