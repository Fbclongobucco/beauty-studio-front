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
  const { date: today, minutes: nowMin } = nowInSalon(now);
  if (!isWorkDay(date) || !isInWindow(date, today)) return [];

  const sameDay = busy
    .filter((b) => b.date === date)
    .map((b) => {
      const s = toMinutes(b.time);
      return [s, s + b.durationMin] as const;
    });

  return gridStarts(durationMin)
    .filter((start) => date !== today || start > nowMin)
    .filter((start) => !sameDay.some(([bs, be]) => overlaps(start, start + durationMin, bs, be)))
    .map(fromMinutes);
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
