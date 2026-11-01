import type { NextRequest } from "next/server";
import { json, notFound } from "@/lib/server/http";
import { toPublicAppointment } from "@/lib/server/presenters";
import { repo } from "@/lib/server/repository";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/appointments/[id]">) {
  const { id } = await ctx.params;
  const a = await repo.getAppointment(id);
  if (!a) return notFound("Agendamento não encontrado.");
  return json(toPublicAppointment(a));
}
