import type { NextRequest } from "next/server";
import { getSession } from "@/lib/server/auth";
import { json, readJson } from "@/lib/server/http";
import { repo } from "@/lib/server/repository";

export async function POST(request: NextRequest) {
  const { session, denied } = await getSession(request);
  if (denied) return denied;
  // Só a profissional dona do pedido marca como visto; a visita do master não apaga o "Novo".
  if (session.role !== "professional") return json({ marked: 0 });
  const body = (await readJson(request)) as { ids?: unknown } | null;
  const ids = Array.isArray(body?.ids) ? body.ids.filter((x): x is string => typeof x === "string") : undefined;
  return json({ marked: await repo.markSeen(ids, session.professionalId!) });
}
