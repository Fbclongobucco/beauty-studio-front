import { addDays, isWorkDay } from "./schedule";
import type { Appointment, EarningsResponse } from "./types";

export const MAX_EARNINGS_DAYS = 366;

/** Erros do período, por campo; null se válido. */
export function validateEarningsPeriod(from: unknown, to: unknown, isDate: (s: unknown) => boolean) {
  const fields: Record<string, string> = {};
  if (!isDate(from)) fields.from = "Data inválida (use AAAA-MM-DD).";
  if (!isDate(to)) fields.to = "Data inválida (use AAAA-MM-DD).";
  if (Object.keys(fields).length) return fields;
  if ((to as string) < (from as string)) return { to: "A data final deve ser depois da inicial" };
  if (addDays(from as string, MAX_EARNINGS_DAYS - 1) < (to as string)) {
    return { to: `O período pode ter no máximo ${MAX_EARNINGS_DAYS} dias.` };
  }
  return null;
}

/**
 * Ganhos pelo preço gravado em cada agendamento confirmado do período.
 * Pendentes, recusados e cancelados ficam fora; sem preço é contado à parte.
 */
export function computeEarnings(
  appointments: Appointment[],
  { from, to, now }: { from: string; to: string; now: Date },
): EarningsResponse {
  const out: EarningsResponse = {
    from,
    to,
    total: { cents: 0, count: 0 },
    realized: { cents: 0, count: 0 },
    expected: { cents: 0, count: 0 },
    unpriced: 0,
    byService: [],
    byDay: [],
    byProfessional: [],
  };
  const services = new Map<string, { name: string; count: number; cents: number }>();
  const days = new Map<string, { date: string; realizedCents: number; expectedCents: number }>();
  const profs = new Map<string, { professionalId: string; name: string; count: number; cents: number }>();
  for (let d = from; d <= to; d = addDays(d, 1)) {
    if (isWorkDay(d)) days.set(d, { date: d, realizedCents: 0, expectedCents: 0 });
  }

  for (const a of appointments) {
    if (a.status !== "confirmed" || a.date < from || a.date > to) continue;
    if (a.priceCents === null) {
      out.unpriced++;
      continue;
    }
    const cents = a.priceCents;
    const done = new Date(a.endISO).getTime() <= now.getTime();
    out.total.cents += cents;
    out.total.count++;
    const bucket = done ? out.realized : out.expected;
    bucket.cents += cents;
    bucket.count++;

    const s = services.get(a.serviceName) ?? { name: a.serviceName, count: 0, cents: 0 };
    s.count++;
    s.cents += cents;
    services.set(a.serviceName, s);

    const day = days.get(a.date) ?? { date: a.date, realizedCents: 0, expectedCents: 0 };
    if (done) day.realizedCents += cents;
    else day.expectedCents += cents;
    days.set(a.date, day);

    const p = profs.get(a.professionalId) ?? { professionalId: a.professionalId, name: a.professionalName, count: 0, cents: 0 };
    p.count++;
    p.cents += cents;
    profs.set(a.professionalId, p);
  }

  const byValue = (x: { cents: number; name: string }, y: { cents: number; name: string }) =>
    y.cents - x.cents || x.name.localeCompare(y.name, "pt-BR");
  out.byService = [...services.values()].sort(byValue);
  out.byDay = [...days.values()].sort((x, y) => x.date.localeCompare(y.date));
  out.byProfessional = [...profs.values()].sort(byValue);
  return out;
}
