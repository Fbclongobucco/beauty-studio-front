import type { NextRequest } from "next/server";
import { getSession, requireMaster } from "@/lib/server/auth";
import { json, readJson, validationError } from "@/lib/server/http";
import { repo } from "@/lib/server/repository";

export async function GET(request: NextRequest) {
  const { denied } = await getSession(request);
  if (denied) return denied;
  return json({ categories: await repo.listCategories() });
}

export async function POST(request: NextRequest) {
  const { session, denied } = await getSession(request);
  if (denied) return denied;
  const notMaster = requireMaster(session);
  if (notMaster) return notMaster;
  const body = (await readJson(request)) as { name?: unknown; note?: unknown } | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const note = typeof body?.note === "string" && body.note.trim() ? body.note.trim() : null;
  if (name.length < 2 || name.length > 40) return validationError({ name: "Informe o nome da categoria (2 a 40 caracteres)." });
  if (note && note.length > 200) return validationError({ note: "Use no máximo 200 caracteres." });
  return json(await repo.createCategory(name, note), 201);
}
