import type { NextRequest } from "next/server";
import { validateServiceInput } from "@/lib/domain/validation";
import { requireAdmin } from "@/lib/server/auth";
import { json, notFound, readJson, validationError } from "@/lib/server/http";
import { repo } from "@/lib/server/repository";
import { checkRefs } from "@/lib/server/refs";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/services/[id]">) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const parsed = validateServiceInput(await readJson(request), true);
  if (!parsed.ok) return validationError(parsed.fields);
  const fields = await checkRefs(parsed.value.categoryId, parsed.value.professionalId);
  if (fields) return validationError(fields);
  const svc = await repo.updateService(id, parsed.value);
  return svc ? json(svc) : notFound("Serviço não encontrado.");
}
