import type { NextRequest } from "next/server";
import { validateServiceInput, type ServiceInput } from "@/lib/domain/validation";
import { getSession, scopeProfessional } from "@/lib/server/auth";
import { forbidden, json, readJson, validationError } from "@/lib/server/http";
import { repo } from "@/lib/server/repository";
import { checkRefs } from "@/lib/server/refs";

export async function GET(request: NextRequest) {
  const { session, denied } = await getSession(request);
  if (denied) return denied;
  const own = scopeProfessional(session);
  const [services, categories, professionals] = await Promise.all([
    repo.listServices(),
    repo.listCategories(),
    repo.listProfessionals(),
  ]);
  return json({
    services: own ? services.filter((s) => s.professionalId === own) : services,
    categories,
    professionals: own ? professionals.filter((p) => p.id === own) : professionals,
  });
}

export async function POST(request: NextRequest) {
  const { session, denied } = await getSession(request);
  if (denied) return denied;
  const body = ((await readJson(request)) ?? {}) as Record<string, unknown>;
  const own = scopeProfessional(session);
  if (own) {
    // Profissional cria serviço sempre em nome dela.
    if (body.professionalId !== undefined && body.professionalId !== own) {
      return forbidden("Você só pode criar serviços em seu nome.");
    }
    body.professionalId = own;
  }
  const parsed = validateServiceInput(body, false);
  if (!parsed.ok) return validationError(parsed.fields);
  const v = parsed.value as ServiceInput;
  const fields = await checkRefs(v.categoryId, v.professionalId);
  if (fields) return validationError(fields);
  return json(await repo.createService({ ...v, subcategory: v.subcategory ?? null }), 201);
}
