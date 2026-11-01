import type { NextRequest } from "next/server";
import { isDateString } from "@/lib/domain/schedule";
import type { AppointmentStatus } from "@/lib/domain/types";
import { getSession, scopeProfessional } from "@/lib/server/auth";
import { json, validationError } from "@/lib/server/http";
import { repo } from "@/lib/server/repository";

const STATUSES: AppointmentStatus[] = ["pending", "confirmed", "rejected", "cancelled"];

export async function GET(request: NextRequest) {
  const { session, denied } = await getSession(request);
  if (denied) return denied;
  const q = request.nextUrl.searchParams;
  const status = q.get("status") || undefined;
  const date = q.get("date") || undefined;
  const from = q.get("from") || undefined;
  const to = q.get("to") || undefined;
  const fields: Record<string, string> = {};
  if (status && !STATUSES.includes(status as AppointmentStatus)) fields.status = "Status inválido.";
  if (date && !isDateString(date)) fields.date = "Data inválida (use AAAA-MM-DD).";
  if (from && !isDateString(from)) fields.from = "Data inválida (use AAAA-MM-DD).";
  if (to && !isDateString(to)) fields.to = "Data inválida (use AAAA-MM-DD).";
  if (Object.keys(fields).length) return validationError(fields);

  const professionalId = scopeProfessional(session, q.get("professionalId") || undefined);
  const appointments = await repo.listAppointments({
    status: status as AppointmentStatus | undefined,
    date,
    from,
    to,
    professionalId,
  });
  return json({ appointments });
}
