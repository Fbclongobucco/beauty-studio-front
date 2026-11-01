export type ID = string;

export interface Professional {
  id: ID;
  name: string;
  active: boolean;
}

export interface Category {
  id: ID;
  name: string;
  note: string | null;
  sortOrder: number;
}

export interface Service {
  id: ID;
  name: string;
  categoryId: ID;
  subcategory: string | null;
  durationMin: number;
  /** true enquanto a duração for ESTIMATIVA não revisada pelo salão. */
  durationEstimated: boolean;
  /** Preço em centavos; null = "Consultar valor". */
  priceCents: number | null;
  professionalId: ID;
  active: boolean;
  sortOrder: number;
}

export type AppointmentStatus = "pending" | "confirmed" | "rejected" | "cancelled";

export interface Appointment {
  id: ID;
  serviceId: ID;
  professionalId: ID;
  /** Cópias do serviço no momento do pedido. */
  serviceName: string;
  professionalName: string;
  durationMin: number;
  priceCents: number | null;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  startISO: string;
  endISO: string;
  customerName: string;
  customerPhoneE164: string;
  notes: string | null;
  status: AppointmentStatus;
  createdAt: string;
  confirmedAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
  reason: string | null;
  seenByAdminAt: string | null;
}

export type ConflictKind = "confirmed" | "pending";

export type StatusAction = "confirm" | "reject" | "cancel";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "SLOT_UNAVAILABLE"
  | "SLOT_TAKEN"
  | "INVALID_TRANSITION"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "LOGIN_DISABLED";

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  fields?: Record<string, string>;
}

// ---- Contratos públicos da API ----

export interface PublicService {
  id: ID;
  name: string;
  subcategory: string | null;
  durationMin: number;
  priceCents: number | null;
  professional: { id: ID; name: string };
}

export interface PublicCategory {
  id: ID;
  name: string;
  note: string | null;
  services: PublicService[];
}

export interface ServicesResponse {
  categories: PublicCategory[];
}

export interface AvailabilityResponse {
  serviceId: ID;
  date: string;
  slots: string[];
}

export interface DayAvailability {
  date: string;
  open: boolean;
  hasSlots: boolean;
}

export interface DaysResponse {
  serviceId: ID;
  days: DayAvailability[];
}

export interface CreateAppointmentInput {
  serviceId: ID;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  notes?: string;
}

export interface PublicAppointment {
  id: ID;
  status: AppointmentStatus;
  serviceName: string;
  professionalName: string;
  durationMin: number;
  priceCents: number | null;
  date: string;
  time: string;
  startISO: string;
  endISO: string;
  customerFirstName: string;
}

export interface AdminAppointment extends Appointment {
  conflict: ConflictKind | null;
}
