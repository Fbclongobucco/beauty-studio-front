import type {
  Appointment,
  AppointmentStatus,
  Category,
  ConflictKind,
  Professional,
  Service,
  StatusAction,
} from "@/lib/domain/types";
import { isSlotAvailable } from "@/lib/domain/availability";
import { conflictOf, nextStatus, sameSlotOverlap } from "@/lib/domain/status";
import { isoAt, toMinutes } from "@/lib/domain/schedule";
import type { BookingValue, ServiceInput } from "@/lib/domain/validation";
import type { DomainEventType } from "./events";
import { getStore, type Store } from "./store";

export interface AppointmentFilter {
  status?: AppointmentStatus;
  date?: string;
  professionalId?: string;
}

export type CreateResult =
  | { ok: true; appointment: Appointment }
  | { ok: false; reason: "SERVICE_NOT_FOUND" | "SLOT_UNAVAILABLE" };

export type TransitionResult =
  | { ok: true; appointment: Appointment }
  | { ok: false; reason: "NOT_FOUND" | "INVALID_TRANSITION" | "SLOT_TAKEN" };

/**
 * Contrato de acesso a dados. A implementação em memória abaixo será trocada
 * pelo backend definitivo (que exporá os mesmos endpoints HTTP).
 */
export interface Repository {
  listProfessionals(): Promise<Professional[]>;
  createProfessional(name: string): Promise<Professional>;
  listCategories(): Promise<Category[]>;
  createCategory(name: string, note: string | null): Promise<Category>;
  updateCategory(id: string, patch: Partial<Pick<Category, "name" | "note">>): Promise<Category | null>;
  listServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | null>;
  createService(input: ServiceInput): Promise<Service>;
  updateService(id: string, patch: Partial<ServiceInput>): Promise<Service | null>;
  confirmedBusy(professionalId: string): Promise<Pick<Appointment, "date" | "time" | "durationMin">[]>;
  listAppointments(filter?: AppointmentFilter): Promise<(Appointment & { conflict: ConflictKind | null })[]>;
  getAppointment(id: string): Promise<Appointment | null>;
  createAppointment(input: BookingValue, now?: Date): Promise<CreateResult>;
  transition(id: string, action: StatusAction, reason?: string): Promise<TransitionResult>;
  pendingCount(): Promise<{ pending: number; unseen: number }>;
  markSeen(ids?: string[]): Promise<number>;
}

const EVENT_BY_STATUS: Partial<Record<AppointmentStatus, DomainEventType>> = {
  confirmed: "appointment.confirmed",
  rejected: "appointment.rejected",
  cancelled: "appointment.cancelled",
};

function slugify(s: string): string {
  return (
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "item"
  );
}

function uniqueId(base: string, taken: { id: string }[]): string {
  let id = slugify(base);
  let n = 2;
  while (taken.some((t) => t.id === id)) id = `${slugify(base)}-${n++}`;
  return id;
}

function byDateTime(a: Appointment, b: Appointment) {
  return a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.createdAt.localeCompare(b.createdAt);
}

export function createMemoryRepository(store: () => Store = getStore): Repository {
  const emit = (type: DomainEventType, a: Appointment) => {
    const s = store();
    const svc = s.services.find((x) => x.id === a.serviceId);
    s.events.emit({
      type,
      at: new Date().toISOString(),
      appointment: structuredClone(a),
      service: svc ? { id: svc.id, name: svc.name, durationMin: svc.durationMin } : null,
      customerPhoneE164: a.customerPhoneE164,
    });
  };

  const busyOf = (professionalId: string) =>
    store().appointments.filter((a) => a.professionalId === professionalId && a.status === "confirmed");

  return {
    async listProfessionals() {
      return structuredClone(store().professionals);
    },
    async createProfessional(name) {
      const s = store();
      const p: Professional = { id: uniqueId(name.split(" ")[0], s.professionals), name, active: true };
      s.professionals.push(p);
      return structuredClone(p);
    },
    async listCategories() {
      return structuredClone([...store().categories].sort((a, b) => a.sortOrder - b.sortOrder));
    },
    async createCategory(name, note) {
      const s = store();
      const c: Category = {
        id: uniqueId(name, s.categories),
        name,
        note,
        sortOrder: Math.max(0, ...s.categories.map((x) => x.sortOrder)) + 1,
      };
      s.categories.push(c);
      return structuredClone(c);
    },
    async updateCategory(id, patch) {
      const c = store().categories.find((x) => x.id === id);
      if (!c) return null;
      Object.assign(c, patch);
      return structuredClone(c);
    },
    async listServices() {
      return structuredClone([...store().services].sort((a, b) => a.sortOrder - b.sortOrder));
    },
    async getService(id) {
      const svc = store().services.find((x) => x.id === id);
      return svc ? structuredClone(svc) : null;
    },
    async createService(input) {
      const s = store();
      const svc: Service = {
        id: uniqueId(input.name, s.services),
        ...input,
        durationEstimated: false,
        sortOrder: Math.max(0, ...s.services.map((x) => x.sortOrder)) + 1,
      };
      s.services.push(svc);
      return structuredClone(svc);
    },
    async updateService(id, patch) {
      const svc = store().services.find((x) => x.id === id);
      if (!svc) return null;
      Object.assign(svc, patch);
      // Duração revisada pelo salão deixa de ser estimativa.
      if (patch.durationMin !== undefined) svc.durationEstimated = false;
      return structuredClone(svc);
    },
    async confirmedBusy(professionalId) {
      return busyOf(professionalId).map(({ date, time, durationMin }) => ({ date, time, durationMin }));
    },
    async listAppointments(filter = {}) {
      const all = store().appointments;
      return all
        .filter(
          (a) =>
            (!filter.status || a.status === filter.status) &&
            (!filter.date || a.date === filter.date) &&
            (!filter.professionalId || a.professionalId === filter.professionalId),
        )
        .sort(byDateTime)
        .map((a) => ({ ...structuredClone(a), conflict: conflictOf(a, all) }));
    },
    async getAppointment(id) {
      const a = store().appointments.find((x) => x.id === id);
      return a ? structuredClone(a) : null;
    },
    async createAppointment(input, now = new Date()) {
      // Sem `await` entre a checagem e a gravação: atômico dentro do processo.
      const s = store();
      const svc = s.services.find((x) => x.id === input.serviceId && x.active);
      if (!svc) return { ok: false, reason: "SERVICE_NOT_FOUND" };
      if (!isSlotAvailable(svc.durationMin, input.date, input.time, busyOf(svc.professionalId), now)) {
        return { ok: false, reason: "SLOT_UNAVAILABLE" };
      }
      const prof = s.professionals.find((p) => p.id === svc.professionalId);
      const start = toMinutes(input.time);
      const a: Appointment = {
        id: crypto.randomUUID(),
        serviceId: svc.id,
        professionalId: svc.professionalId,
        serviceName: svc.name,
        professionalName: prof?.name ?? "",
        durationMin: svc.durationMin,
        priceCents: svc.priceCents,
        date: input.date,
        time: input.time,
        startISO: isoAt(input.date, start),
        endISO: isoAt(input.date, start + svc.durationMin),
        customerName: input.customerName,
        customerPhoneE164: input.customerPhoneE164,
        notes: input.notes,
        status: "pending",
        createdAt: now.toISOString(),
        confirmedAt: null,
        rejectedAt: null,
        cancelledAt: null,
        reason: null,
        seenByAdminAt: null,
      };
      s.appointments.push(a);
      emit("appointment.created", a);
      return { ok: true, appointment: structuredClone(a) };
    },
    async transition(id, action, reason) {
      const s = store();
      const a = s.appointments.find((x) => x.id === id);
      if (!a) return { ok: false, reason: "NOT_FOUND" };
      const to = nextStatus(a.status, action);
      if (!to) return { ok: false, reason: "INVALID_TRANSITION" };
      if (action === "confirm" && s.appointments.some((o) => o.status === "confirmed" && sameSlotOverlap(a, o))) {
        return { ok: false, reason: "SLOT_TAKEN" };
      }
      const at = new Date().toISOString();
      a.status = to;
      if (to === "confirmed") a.confirmedAt = at;
      if (to === "rejected") a.rejectedAt = at;
      if (to === "cancelled") a.cancelledAt = at;
      if (reason) a.reason = reason.slice(0, 300);
      a.seenByAdminAt ??= at;
      emit(EVENT_BY_STATUS[to]!, a);
      return { ok: true, appointment: structuredClone(a) };
    },
    async pendingCount() {
      const pending = store().appointments.filter((a) => a.status === "pending");
      return { pending: pending.length, unseen: pending.filter((a) => !a.seenByAdminAt).length };
    },
    async markSeen(ids) {
      const at = new Date().toISOString();
      let n = 0;
      for (const a of store().appointments) {
        if (a.status !== "pending" || a.seenByAdminAt) continue;
        if (ids && !ids.includes(a.id)) continue;
        a.seenByAdminAt = at;
        n++;
      }
      return n;
    },
  };
}

export const repo: Repository = createMemoryRepository();
