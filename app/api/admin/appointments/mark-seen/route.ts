import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { json, readJson } from "@/lib/server/http";
import { repo } from "@/lib/server/repository";

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const body = (await readJson(request)) as { ids?: unknown } | null;
  const ids = Array.isArray(body?.ids) ? body.ids.filter((x): x is string => typeof x === "string") : undefined;
  return json({ marked: await repo.markSeen(ids) });
}
