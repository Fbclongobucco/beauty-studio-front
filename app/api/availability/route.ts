import type { NextRequest } from "next/server";
import { availableSlots } from "@/lib/domain/availability";
import { isDateString } from "@/lib/domain/schedule";
import type { AvailabilityResponse } from "@/lib/domain/types";
import { json, notFound, validationError } from "@/lib/server/http";
import { repo } from "@/lib/server/repository";

export async function GET(request: NextRequest) {
  const serviceId = request.nextUrl.searchParams.get("serviceId") ?? "";
  const date = request.nextUrl.searchParams.get("date") ?? "";
  const fields: Record<string, string> = {};
  if (!serviceId) fields.serviceId = "Informe o serviço.";
  if (!isDateString(date)) fields.date = "Data inválida (use AAAA-MM-DD).";
  if (Object.keys(fields).length) return validationError(fields);

  const svc = await repo.getService(serviceId);
  if (!svc || !svc.active) return notFound("Serviço não encontrado.");
  const busy = await repo.confirmedBusy(svc.professionalId);
  const body: AvailabilityResponse = { serviceId, date, slots: availableSlots(svc.durationMin, date, busy) };
  return json(body);
}
