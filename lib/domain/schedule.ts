export const TZ = "America/Sao_Paulo";
/** Brasil sem horário de verão desde 2019: offset fixo. */
export const TZ_OFFSET = "-03:00";
export const OPEN_MIN = 9 * 60; // 09:00
export const CLOSE_MIN = 20 * 60; // 20:00
export const STEP_MIN = 30;
/** 0 = domingo ... 6 = sábado. Segunda a sábado. */
export const WORK_DAYS = [1, 2, 3, 4, 5, 6];
export const WINDOW_DAYS = 30;
export const MIN_DURATION = 30;
export const MAX_DURATION = 8 * 60;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isDateString(s: unknown): s is string {
  if (typeof s !== "string" || !DATE_RE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function isTimeString(s: unknown): s is string {
  return typeof s === "string" && TIME_RE.test(s);
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parseDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function weekday(date: string): number {
  return parseDate(date).getUTCDay();
}

export function addDays(date: string, n: number): string {
  const d = parseDate(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function isWorkDay(date: string): boolean {
  return WORK_DAYS.includes(weekday(date));
}

/** Data e minuto do dia atuais no fuso do salão, independente do fuso da máquina. */
let salonFmt: Intl.DateTimeFormat | null = null;

export function nowInSalon(now: Date = new Date()): { date: string; minutes: number } {
  salonFmt ??= new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = salonFmt.formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

/** Último dia agendável (hoje + 30 dias corridos). */
export function windowEnd(today: string): string {
  return addDays(today, WINDOW_DAYS);
}

export function isInWindow(date: string, today: string): boolean {
  return date >= today && date <= windowEnd(today);
}

/** Inícios possíveis na grade para a duração, terminando até CLOSE_MIN. */
export function gridStarts(durationMin: number): number[] {
  const out: number[] = [];
  for (let t = OPEN_MIN; t + durationMin <= CLOSE_MIN; t += STEP_MIN) out.push(t);
  return out;
}

export function isoAt(date: string, minutes: number): string {
  // Minutos podem passar de 24h? Não: CLOSE_MIN = 20:00.
  return `${date}T${fromMinutes(minutes)}:00${TZ_OFFSET}`;
}

export function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}
