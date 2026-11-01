import type { NextRequest } from "next/server";
import { availableDays } from "@/lib/domain/availability";
import { isDateString, WINDOW_DAYS } from "@/lib/domain/schedule";
import type { DaysResponse } from "@/lib/domain/types";
import { json, notFound, validationError } from "@/lib/server/http";
import { repo } from "@/lib/server/repository";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const serviceId = q.get("serviceId") ?? "";
  const from = q.get("from") ?? "";
  const days = Number(q.get("days") ?? WINDOW_DAYS + 1);
  const fields: Record<string, string> = {};
  if (!serviceId) fields.serviceId = "Informe o serviço.";
  if (!isDateString(from)) fields.from = "Data inválida (use AAAA-MM-DD).";
  if (!Number.isInteger(days) || days < 1 || days > 62) fields.days = "Informe de 1 a 62 dias.";
  if (Object.keys(fields).length) return validationError(fields);

  const svc = await repo.getService(serviceId);
  if (!svc || !svc.active) return notFound("Serviço não encontrado.");
  const busy = await repo.confirmedBusy(svc.professionalId);
  const body: DaysResponse = { serviceId, days: availableDays(svc.durationMin, from, days, busy) };
  return json(body);
}
