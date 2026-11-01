const priceFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** "R$ 1.234,56" (com espaço comum) ou "Consultar valor". */
export function formatPrice(cents: number | null): string {
  if (cents === null) return "Consultar valor";
  return priceFmt.format(cents / 100).replace(/ /g, " ");
}

/** Centavos → texto editável "45,00". */
export function centsToInput(cents: number | null): string {
  if (cents === null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const hs = h === 1 ? "1 hora" : `${h} horas`;
  const ms = `${m} minutos`;
  if (h === 0) return ms;
  if (m === 0) return hs;
  return `${hs} e ${ms}`;
}

/** Forma curta para listas densas do admin: "1 h 30 min". */
export function formatDurationShort(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

function utcDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

/** "sexta-feira, 6 de novembro" */
export function formatDateLong(date: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(utcDate(date));
}

/** "sexta-feira" */
export function formatWeekday(date: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", weekday: "long" }).format(utcDate(date));
}

/** "6 de novembro" */
export function formatDayMonth(date: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", day: "numeric", month: "long" }).format(
    utcDate(date),
  );
}

/** "06/11" */
export function formatDateShort(date: string): string {
  const [, m, d] = date.split("-");
  return `${d}/${m}`;
}

/** "+5521968117976" → "(21) 96811-7976" */
export function formatPhone(e164: string): string {
  const d = e164.replace(/\D/g, "").replace(/^55/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return e164;
}

/** Máscara progressiva para o campo de WhatsApp. */
export function maskPhoneInput(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function whatsappLink(e164: string, text?: string): string {
  const n = e164.replace(/\D/g, "");
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export const STATUS_LABEL = {
  pending: "Aguardando confirmação",
  confirmed: "Confirmado",
  rejected: "Recusado",
  cancelled: "Cancelado",
} as const;
