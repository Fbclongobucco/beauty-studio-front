import type { Appointment, AppointmentStatus, ConflictKind, StatusAction } from "./types";
import { overlaps, toMinutes } from "./schedule";

const TRANSITIONS: Record<StatusAction, { from: AppointmentStatus; to: AppointmentStatus }> = {
  confirm: { from: "pending", to: "confirmed" },
  reject: { from: "pending", to: "rejected" },
  cancel: { from: "confirmed", to: "cancelled" },
};

export function nextStatus(current: AppointmentStatus, action: StatusAction): AppointmentStatus | null {
  const t = TRANSITIONS[action];
  return t.from === current ? t.to : null;
}

type Slot = Pick<Appointment, "id" | "professionalId" | "date" | "time" | "durationMin" | "status">;

export function sameSlotOverlap(a: Slot, b: Slot): boolean {
  if (a.id === b.id || a.professionalId !== b.professionalId || a.date !== b.date) return false;
  const as = toMinutes(a.time);
  const bs = toMinutes(b.time);
  return overlaps(as, as + a.durationMin, bs, bs + b.durationMin);
}

/**
 * Conflito de um pedido pendente:
 * - "confirmed": sobrepõe um confirmado da mesma profissional (não pode ser confirmado);
 * - "pending": sobrepõe outro pendente (só aviso).
 * Agendamentos não pendentes nunca têm conflito.
 */
export function conflictOf(target: Slot, all: Slot[]): ConflictKind | null {
  if (target.status !== "pending") return null;
  const others = all.filter((o) => sameSlotOverlap(target, o));
  if (others.some((o) => o.status === "confirmed")) return "confirmed";
  if (others.some((o) => o.status === "pending")) return "pending";
  return null;
}
