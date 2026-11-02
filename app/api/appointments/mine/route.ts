import type { NextRequest } from "next/server";
import { decodeMyRequests, readMyRequestsCookie } from "@/lib/server/my-requests";
import { myRequestsResponse } from "@/lib/server/my-requests-response";

export async function GET(request: NextRequest) {
  return myRequestsResponse(await decodeMyRequests(readMyRequestsCookie(request)), false);
}
