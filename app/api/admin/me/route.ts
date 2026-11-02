import type { NextRequest } from "next/server";
import { parsePhoneBR, PHONE_MESSAGE } from "@/lib/domain/validation";
import { getSession, sessionFor } from "@/lib/server/auth";
import { forbidden, json, readJson, validationError } from "@/lib/server/http";
import { repo } from "@/lib/server/repository";

export async function GET(request: NextRequest) {
  const { session, denied } = await getSession(request);
  if (denied) return denied;
  return json(session);
}

/** A profissional informa o próprio WhatsApp; null ou vazio remove. O master não tem número. */
export async function PATCH(request: NextRequest) {
  const { session, denied } = await getSession(request);
  if (denied) return denied;
  if (session.role !== "professional" || !session.professionalId) {
    return forbidden("Só a profissional altera o próprio WhatsApp.");
  }
  const body = (await readJson(request)) as { whatsappPhone?: unknown } | null;
  const raw = body?.whatsappPhone;
  let phone: string | null = null;
  if (raw !== null && raw !== undefined && !(typeof raw === "string" && raw.trim() === "")) {
    phone = parsePhoneBR(raw);
    if (!phone) return validationError({ whatsappPhone: PHONE_MESSAGE });
  }
  await repo.updateProfessionalWhatsapp(session.professionalId, phone);
  return json(await sessionFor(session.professionalId));
}
