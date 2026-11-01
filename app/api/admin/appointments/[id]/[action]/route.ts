import type { NextRequest } from "next/server";
import type { StatusAction } from "@/lib/domain/types";
import { canAccess, getSession } from "@/lib/server/auth";
import { apiError, json, notFound, readJson } from "@/lib/server/http";
import { repo } from "@/lib/server/repository";

const ACTIONS: StatusAction[] = ["confirm", "reject", "cancel"];

export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/appointments/[id]/[action]">) {
  const { session, denied } = await getSession(request);
  if (denied) return denied;
  const { id, action } = await ctx.params;
  if (!ACTIONS.includes(action as StatusAction)) return notFound("Ação desconhecida.");
  // Pedido de outra profissional: 404, sem revelar que existe.
  const current = await repo.getAppointment(id);
  if (!current || !canAccess(session, current.professionalId)) return notFound("Agendamento não encontrado.");

  const body = (await readJson(request)) as { reason?: unknown } | null;
  const reason = typeof body?.reason === "string" && body.reason.trim() ? body.reason.trim() : undefined;

  const r = await repo.transition(id, action as StatusAction, reason);
  if (r.ok) return json(r.appointment);
  if (r.reason === "NOT_FOUND") return notFound("Agendamento não encontrado.");
  if (r.reason === "SLOT_TAKEN") return apiError(409, "SLOT_TAKEN", "Horário já ocupado por outro agendamento confirmado");
  return apiError(409, "INVALID_TRANSITION", "Essa ação não é possível no status atual.");
}
