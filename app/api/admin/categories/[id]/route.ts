import type { NextRequest } from "next/server";
import type { Category } from "@/lib/domain/types";
import { getSession, requireMaster } from "@/lib/server/auth";
import { json, notFound, readJson, validationError } from "@/lib/server/http";
import { repo } from "@/lib/server/repository";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/categories/[id]">) {
  const { session, denied } = await getSession(request);
  if (denied) return denied;
  const notMaster = requireMaster(session);
  if (notMaster) return notMaster;
  const { id } = await ctx.params;
  const body = (await readJson(request)) as { name?: unknown; note?: unknown } | null;
  const patch: Partial<Pick<Category, "name" | "note">> = {};
  const fields: Record<string, string> = {};
  if (body?.name !== undefined) {
    const n = typeof body.name === "string" ? body.name.trim() : "";
    if (n.length < 2 || n.length > 40) fields.name = "Informe o nome da categoria (2 a 40 caracteres).";
    else patch.name = n;
  }
  if (body?.note !== undefined) {
    if (body.note === null || body.note === "") patch.note = null;
    else if (typeof body.note !== "string" || body.note.trim().length > 200) fields.note = "Use no máximo 200 caracteres.";
    else patch.note = body.note.trim();
  }
  if (Object.keys(fields).length) return validationError(fields);
  const c = await repo.updateCategory(id, patch);
  return c ? json(c) : notFound("Categoria não encontrada.");
}
