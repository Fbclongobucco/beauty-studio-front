import type { MyRequestsResponse } from "@/lib/domain/types";
import { json } from "./http";
import { isInProgress, myRequestsSetCookie } from "./my-requests";
import { toPublicAppointment } from "./presenters";
import { repo } from "./repository";

/** Pedidos em andamento deste aparelho, do início mais próximo para o mais distante. */
export async function myRequestsResponse(ids: string[], cookieChanged: boolean): Promise<Response> {
  const found = (await Promise.all(ids.map((id) => repo.getAppointment(id)))).filter((a) => a !== null);
  const now = Date.now();
  const body: MyRequestsResponse = {
    appointments: found
      .filter((a) => isInProgress(a, now))
      .sort((x, y) => Date.parse(x.startISO) - Date.parse(y.startISO))
      .map(toPublicAppointment),
  };
  const res = json(body);
  const remaining = ids.filter((id) => found.some((a) => a.id === id));
  // Ids que não existem mais saem do cookie
  if (cookieChanged || remaining.length !== ids.length) {
    res.headers.append("Set-Cookie", await myRequestsSetCookie(remaining));
  }
  return res;
}
