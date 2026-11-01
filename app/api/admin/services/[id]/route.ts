import type { NextRequest } from "next/server";
import { validateServiceInput } from "@/lib/domain/validation";
import { canAccess, getSession } from "@/lib/server/auth";
import { forbidden, json, notFound, readJson, validationError } from "@/lib/server/http";
import { repo } from "@/lib/server/repository";
import { checkRefs } from "@/lib/server/refs";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/services/[id]">) {
  const { session, denied } = await getSession(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  // Serviço de outra profissional: 404, sem revelar que existe.
  const current = await repo.getService(id);
  if (!current || !canAccess(session, current.professionalId)) return notFound("Serviço não encontrado.");
  const parsed = validateServiceInput(await readJson(request), true);
  if (!parsed.ok) return validationError(parsed.fields);
  if (
    session.role !== "master" &&
    parsed.value.professionalId !== undefined &&
    parsed.value.professionalId !== current.professionalId
  ) {
    return forbidden("Só o master pode trocar a profissional do serviço.");
  }
  const fields = await checkRefs(parsed.value.categoryId, parsed.value.professionalId);
  if (fields) return validationError(fields);
  const svc = await repo.updateService(id, parsed.value);
  return svc ? json(svc) : notFound("Serviço não encontrado.");
}
