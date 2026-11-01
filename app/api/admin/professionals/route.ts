import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { json, readJson, validationError } from "@/lib/server/http";
import { repo } from "@/lib/server/repository";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  return json({ professionals: await repo.listProfessionals() });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const body = (await readJson(request)) as { name?: unknown } | null;
  const name = typeof body?.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
  if (name.length < 2 || name.length > 60) return validationError({ name: "Informe o nome da profissional." });
  return json(await repo.createProfessional(name), 201);
}
