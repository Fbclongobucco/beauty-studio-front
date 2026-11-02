import {
  addDays,
  fromMinutes,
  gridStarts,
  isInWindow,
  isWorkDay,
  nowInSalon,
  overlaps,
  toMinutes,
} from "./schedule";

/** Intervalo ocupado (agendamento confirmado) da profissional. */
export interface Busy {
  date: string;
  time: string;
  durationMin: number;
}

/** Horários do dia: livres e ocupados por confirmado, em HH:mm e em ordem crescente. */
export interface DaySlots {
  free: string[];
  taken: string[];
}

/**
 * Grade do dia, já sem horários passados, separada em livres e ocupados.
 * `busy` deve conter só os agendamentos CONFIRMADOS da profissional responsável.
 * Dia fechado ou fora da janela: as duas listas vazias.
 */
export function daySlots(durationMin: number, date: string, busy: Busy[], now: Date = new Date()): DaySlots {
  const { date: today, minutes: nowMin } = nowInSalon(now);
  if (!isWorkDay(date) || !isInWindow(date, today)) return { free: [], taken: [] };

  const sameDay = busy
    .filter((b) => b.date === date)
    .map((b) => {
      const s = toMinutes(b.time);
      return [s, s + b.durationMin] as const;
    });

  const free: string[] = [];
  const taken: string[] = [];
  for (const start of gridStarts(durationMin)) {
    if (date === today && start <= nowMin) continue;
    const blocked = sameDay.some(([bs, be]) => overlaps(start, start + durationMin, bs, be));
    (blocked ? taken : free).push(fromMinutes(start));
  }
  return { free, taken };
}

/**
 * Horários de início disponíveis para um serviço numa data.
 * `busy` deve conter só os agendamentos CONFIRMADOS da profissional responsável.
 */
export function availableSlots(
  durationMin: number,
  date: string,
  busy: Busy[],
  now: Date = new Date(),
): string[] {
  return daySlots(durationMin, date, busy, now).free;
}

export function isSlotAvailable(
  durationMin: number,
  date: string,
  time: string,
  busy: Busy[],
  now: Date = new Date(),
): boolean {
  return availableSlots(durationMin, date, busy, now).includes(time);
}

export interface DayInfo {
  date: string;
  open: boolean;
  hasSlots: boolean;
}

/** Disponibilidade resumida por dia, a partir de `from`, por `days` dias, limitada à janela. */
export function availableDays(
  durationMin: number,
  from: string,
  days: number,
  busy: Busy[],
  now: Date = new Date(),
): DayInfo[] {
  const { date: today } = nowInSalon(now);
  const out: DayInfo[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(from, i);
    if (!isInWindow(date, today)) continue;
    const open = isWorkDay(date);
    out.push({
      date,
      open,
      hasSlots: open && availableSlots(durationMin, date, busy, now).length > 0,
    });
  }
  return out;
}
