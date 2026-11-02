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
  /** URL da foto do serviço (absoluta ou relativa à origem da API); null = sem foto. */
  photoUrl: string | null;
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

export type AdminRole = "master" | "professional";

/** Conta logada no painel. Master: `professionalId` null e `name` vazio. */
/** Login de uma profissional: definido no ambiente, criado no painel (memória) ou inexistente. */
export interface AdminAccount {
  professionalId: ID;
  name: string;
  login: "env" | "memory" | null;
}

export interface AdminAccountsResponse {
  masterUsername: string;
  accounts: AdminAccount[];
}

export interface AdminSession {
  role: AdminRole;
  professionalId: ID | null;
  name: string;
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
  | "FORBIDDEN"
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
  photoUrl: string | null;
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

// ---- Ganhos (painel admin) ----

export interface EarningsBucket {
  /** Soma em centavos. */
  cents: number;
  /** Atendimentos somados. */
  count: number;
}

export interface EarningsResponse {
  from: string;
  to: string;
  total: EarningsBucket;
  /** Atendimentos já terminados. */
  realized: EarningsBucket;
  /** Atendimentos que ainda não terminaram. */
  expected: EarningsBucket;
  /** Confirmados sem preço ("Consultar valor"), fora da soma. */
  unpriced: number;
  /** Ordenado do maior para o menor valor. */
  byService: { name: string; count: number; cents: number }[];
  /** Um item por dia útil do período (e por dia com atendimento). */
  byDay: { date: string; realizedCents: number; expectedCents: number }[];
  byProfessional: { professionalId: ID; name: string; count: number; cents: number }[];
}
