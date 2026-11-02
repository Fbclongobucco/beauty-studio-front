import type { NextRequest } from "next/server";
import { detectImageType, PHOTO_MAX_BYTES, PHOTO_MESSAGES } from "@/lib/domain/photo";
import { canAccess, getSession } from "@/lib/server/auth";
import { json, notFound, validationError } from "@/lib/server/http";
import { repo } from "@/lib/server/repository";

/** Folga para os cabeçalhos do multipart além do arquivo. */
const MULTIPART_OVERHEAD = 64 * 1024;

/** Sessão + escopo iguais ao PATCH do serviço: serviço alheio responde 404. */
async function authorize(request: NextRequest, ctx: RouteContext<"/api/admin/services/[id]/photo">) {
  const { session, denied } = await getSession(request);
  if (denied) return { denied };
  const { id } = await ctx.params;
  const current = await repo.getService(id);
  if (!current || !canAccess(session, current.professionalId)) return { denied: notFound("Serviço não encontrado.") };
  return { id };
}

const photoError = (message: string) => validationError({ photo: message });

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/admin/services/[id]/photo">) {
  const auth = await authorize(request, ctx);
  if (auth.denied) return auth.denied;

  // Recusa cedo um corpo grande demais, sem carregá-lo na memória.
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > PHOTO_MAX_BYTES + MULTIPART_OVERHEAD) return photoError(PHOTO_MESSAGES.size);

  let file: FormDataEntryValue | null = null;
  try {
    file = (await request.formData()).get("photo");
  } catch {
    file = null; // corpo que não é multipart
  }
  if (!file || typeof file === "string") return photoError(PHOTO_MESSAGES.missing);
  if (file.size > PHOTO_MAX_BYTES) return photoError(PHOTO_MESSAGES.size);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) return photoError(PHOTO_MESSAGES.type);

  const svc = await repo.setServicePhoto(auth.id, bytes, type);
  return svc ? json(svc) : notFound("Serviço não encontrado.");
}

export async function DELETE(request: NextRequest, ctx: RouteContext<"/api/admin/services/[id]/photo">) {
  const auth = await authorize(request, ctx);
  if (auth.denied) return auth.denied;
  const svc = await repo.removeServicePhoto(auth.id);
  return svc ? json(svc) : notFound("Serviço não encontrado.");
}
