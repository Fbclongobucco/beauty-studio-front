import type {
  AdminAppointment,
  ApiError,
  Appointment,
  AvailabilityResponse,
  Category,
  CreateAppointmentInput,
  DaysResponse,
  Professional,
  PublicAppointment,
  Service,
  ServicesResponse,
  StatusAction,
} from "@/lib/domain/types";
import type { ServiceInput } from "@/lib/domain/validation";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const FRIENDLY: Partial<Record<ApiError["code"], string>> = {
  SLOT_UNAVAILABLE: "Esse horário acabou de ser ocupado. Escolha outro.",
  SLOT_TAKEN: "Horário já ocupado por outro agendamento confirmado",
  INVALID_TRANSITION: "Essa ação não é possível no status atual.",
  UNAUTHORIZED: "Faça login para continuar.",
};

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public code: ApiError["code"] | "NETWORK",
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...rest,
      credentials: "include",
      cache: "no-store",
      headers: { ...(json !== undefined ? { "content-type": "application/json" } : {}), ...rest.headers },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch {
    throw new ApiRequestError(0, "NETWORK", "Sem conexão. Verifique a internet e tente de novo.");
  }
  if (res.ok) return (await res.json()) as T;
  let err: Partial<ApiError> = {};
  try {
    err = await res.json();
  } catch {}
  const code = (err.code ?? "VALIDATION_ERROR") as ApiError["code"];
  throw new ApiRequestError(
    res.status,
    code,
    err.message ?? FRIENDLY[code] ?? "Algo deu errado. Tente de novo.",
    err.fields,
  );
}

const qs = (p: Record<string, string | number | undefined>) =>
  new URLSearchParams(Object.entries(p).filter(([, v]) => v !== undefined && v !== "") as [string, string][]).toString();

export const api = {
  services: () => request<ServicesResponse>("/api/services"),
  availability: (serviceId: string, date: string) =>
    request<AvailabilityResponse>(`/api/availability?${qs({ serviceId, date })}`),
  days: (serviceId: string, from: string, days: number) =>
    request<DaysResponse>(`/api/availability/days?${qs({ serviceId, from, days })}`),
  createAppointment: (input: CreateAppointmentInput) =>
    request<Appointment>("/api/appointments", { method: "POST", json: input }),
  appointment: (id: string) => request<PublicAppointment>(`/api/appointments/${encodeURIComponent(id)}`),

  admin: {
    login: (password: string) => request<{ ok: true }>("/api/admin/login", { method: "POST", json: { password } }),
    logout: () => request<{ ok: true }>("/api/admin/logout", { method: "POST" }),
    appointments: (f: { status?: string; date?: string; professionalId?: string } = {}) =>
      request<{ appointments: AdminAppointment[] }>(`/api/admin/appointments?${qs(f)}`),
    pendingCount: () => request<{ pending: number; unseen: number }>("/api/admin/appointments/pending-count"),
    markSeen: (ids?: string[]) =>
      request<{ marked: number }>("/api/admin/appointments/mark-seen", { method: "POST", json: { ids } }),
    act: (id: string, action: StatusAction, reason?: string) =>
      request<Appointment>(`/api/admin/appointments/${encodeURIComponent(id)}/${action}`, {
        method: "POST",
        json: { reason },
      }),
    catalog: () =>
      request<{ services: Service[]; categories: Category[]; professionals: Professional[] }>("/api/admin/services"),
    createService: (input: Omit<ServiceInput, "active"> & { active?: boolean }) =>
      request<Service>("/api/admin/services", { method: "POST", json: input }),
    updateService: (id: string, patch: Partial<ServiceInput>) =>
      request<Service>(`/api/admin/services/${encodeURIComponent(id)}`, { method: "PATCH", json: patch }),
    createCategory: (name: string, note?: string | null) =>
      request<Category>("/api/admin/categories", { method: "POST", json: { name, note } }),
    updateCategory: (id: string, patch: { name?: string; note?: string | null }) =>
      request<Category>(`/api/admin/categories/${encodeURIComponent(id)}`, { method: "PATCH", json: patch }),
    createProfessional: (name: string) =>
      request<Professional>("/api/admin/professionals", { method: "POST", json: { name } }),
  },
};
