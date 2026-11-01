import type { NextRequest } from "next/server";
import { computeEarnings, validateEarningsPeriod } from "@/lib/domain/earnings";
import { isDateString } from "@/lib/domain/schedule";
import { getSession, scopeProfessional } from "@/lib/server/auth";
import { json, validationError } from "@/lib/server/http";
import { repo } from "@/lib/server/repository";

export async function GET(request: NextRequest) {
  const { session, denied } = await getSession(request);
  if (denied) return denied;
  const q = request.nextUrl.searchParams;
  const from = q.get("from");
  const to = q.get("to");
  const fields = validateEarningsPeriod(from, to, isDateString);
  if (fields) return validationError(fields);
  const professionalId = scopeProfessional(session, q.get("professionalId") || undefined);
  const list = await repo.listAppointments({ status: "confirmed", from: from!, to: to!, professionalId });
  return json(computeEarnings(list, { from: from!, to: to!, now: new Date() }));
}
