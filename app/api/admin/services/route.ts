import type { NextRequest } from "next/server";
import { validateServiceInput, type ServiceInput } from "@/lib/domain/validation";
import { requireAdmin } from "@/lib/server/auth";
import { json, readJson, validationError } from "@/lib/server/http";
import { repo } from "@/lib/server/repository";
import { checkRefs } from "@/lib/server/refs";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const [services, categories, professionals] = await Promise.all([
    repo.listServices(),
    repo.listCategories(),
    repo.listProfessionals(),
  ]);
  return json({ services, categories, professionals });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const parsed = validateServiceInput(await readJson(request), false);
  if (!parsed.ok) return validationError(parsed.fields);
  const v = parsed.value as ServiceInput;
  const fields = await checkRefs(v.categoryId, v.professionalId);
  if (fields) return validationError(fields);
  return json(await repo.createService({ ...v, subcategory: v.subcategory ?? null }), 201);
}
