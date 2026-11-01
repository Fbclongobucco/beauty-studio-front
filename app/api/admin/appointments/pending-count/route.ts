import type { NextRequest } from "next/server";
import { getSession, scopeProfessional } from "@/lib/server/auth";
import { json } from "@/lib/server/http";
import { repo } from "@/lib/server/repository";

export async function GET(request: NextRequest) {
  const { session, denied } = await getSession(request);
  if (denied) return denied;
  return json(await repo.pendingCount(scopeProfessional(session)));
}
