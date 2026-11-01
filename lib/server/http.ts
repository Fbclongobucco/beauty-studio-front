import type { ApiError, ApiErrorCode } from "@/lib/domain/types";

export function json<T>(data: T, status = 200): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  fields?: Record<string, string>,
): Response {
  const body: ApiError = { code, message, ...(fields ? { fields } : {}) };
  return json(body, status);
}

export const validationError = (fields: Record<string, string>) =>
  apiError(400, "VALIDATION_ERROR", "Confira os campos destacados.", fields);

export const notFound = (message = "Não encontrado.") => apiError(404, "NOT_FOUND", message);

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
