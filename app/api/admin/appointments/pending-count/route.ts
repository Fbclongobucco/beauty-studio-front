import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { json } from "@/lib/server/http";
import { repo } from "@/lib/server/repository";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  return json(await repo.pendingCount());
}
