import type { NextRequest } from "next/server";
import { json, notFound } from "@/lib/server/http";
import { toPublicAppointment } from "@/lib/server/presenters";
import { myRequestsSetCookie, decodeMyRequests, readMyRequestsCookie, withFirst } from "@/lib/server/my-requests";
import { repo } from "@/lib/server/repository";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/appointments/[id]">) {
  const { id } = await ctx.params;
  const a = await repo.getAppointment(id);
  if (!a) return notFound("Agendamento não encontrado.");
  const res = json(toPublicAppointment(a));
  // Abrir o link do pedido lembra o pedido neste aparelho
  res.headers.append("Set-Cookie", await myRequestsSetCookie(withFirst(await decodeMyRequests(readMyRequestsCookie(req)), a.id)));
  return res;
}
