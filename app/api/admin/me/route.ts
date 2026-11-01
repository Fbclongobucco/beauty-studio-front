import type { NextRequest } from "next/server";
import { getSession } from "@/lib/server/auth";
import { json } from "@/lib/server/http";

export async function GET(request: NextRequest) {
  const { session, denied } = await getSession(request);
  if (denied) return denied;
  return json(session);
}
