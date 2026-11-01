import type { NextRequest } from "next/server";
import { isDateString } from "@/lib/domain/schedule";
import type { AppointmentStatus } from "@/lib/domain/types";
import { requireAdmin } from "@/lib/server/auth";
import { json, validationError } from "@/lib/server/http";
import { repo } from "@/lib/server/repository";

const STATUSES: AppointmentStatus[] = ["pending", "confirmed", "rejected", "cancelled"];

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const q = request.nextUrl.searchParams;
  const status = q.get("status") || undefined;
  const date = q.get("date") || undefined;
  const professionalId = q.get("professionalId") || undefined;
  const fields: Record<string, string> = {};
  if (status && !STATUSES.includes(status as AppointmentStatus)) fields.status = "Status inválido.";
  if (date && !isDateString(date)) fields.date = "Data inválida (use AAAA-MM-DD).";
  if (Object.keys(fields).length) return validationError(fields);

  const appointments = await repo.listAppointments({ status: status as AppointmentStatus | undefined, date, professionalId });
  return json({ appointments });
}
