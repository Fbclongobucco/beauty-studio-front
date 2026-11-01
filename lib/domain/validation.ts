import type { CreateAppointmentInput } from "./types";
import { isDateString, isTimeString, MAX_DURATION, MIN_DURATION, STEP_MIN } from "./schedule";

export type Result<T> = { ok: true; value: T } | { ok: false; fields: Record<string, string> };

export const PHONE_MESSAGE = "Informe o WhatsApp com DDD, ex.: (21) 96811-7976";

/** Telefone brasileiro com DDD (10 ou 11 dígitos, com ou sem +55) → E.164. */
export function parsePhoneBR(input: unknown): string | null {
  if (typeof input !== "string") return null;
  let d = input.replace(/\D/g, "");
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  if (d.length !== 10 && d.length !== 11) return null;
  const ddd = Number(d.slice(0, 2));
  if (ddd < 11 || ddd > 99) return null;
  if (d.length === 11 && d[2] !== "9") return null;
  return `+55${d}`;
}

/** Preço digitado em reais ("45,00", "R$ 1.234,56", "45") → centavos. null se inválido. */
export function parsePriceBRL(input: string): number | null {
  const s = input.replace(/R\$/i, "").replace(/\s/g, "");
  if (!s) return null;
  let normalized: string;
  if (/^\d{1,3}(\.\d{3})*(,\d{1,2})?$/.test(s) || /^\d+(,\d{1,2})?$/.test(s)) {
    normalized = s.replace(/\./g, "").replace(",", ".");
  } else if (/^\d+(\.\d{1,2})?$/.test(s)) {
    normalized = s;
  } else {
    return null;
  }
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

export function validateDuration(min: unknown): string | null {
  if (typeof min !== "number" || !Number.isInteger(min)) return "Informe a duração em minutos.";
  if (min % STEP_MIN !== 0) return "A duração deve ser múltiplo de 30 minutos.";
  if (min < MIN_DURATION || min > MAX_DURATION) return "A duração deve ficar entre 30 minutos e 8 horas.";
  return null;
}

export function validatePriceCents(v: unknown): string | null {
  if (v === null) return null;
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0) return "Informe um valor em reais, ex.: 45,00";
  return null;
}

export interface BookingValue {
  serviceId: string;
  date: string;
  time: string;
  customerName: string;
  customerPhoneE164: string;
  notes: string | null;
}

export function validateBooking(body: unknown): Result<BookingValue> {
  const b = (body ?? {}) as Partial<Record<keyof CreateAppointmentInput, unknown>>;
  const fields: Record<string, string> = {};

  if (typeof b.serviceId !== "string" || !b.serviceId) fields.serviceId = "Escolha um serviço.";
  if (!isDateString(b.date)) fields.date = "Data inválida (use AAAA-MM-DD).";
  if (!isTimeString(b.time)) fields.time = "Horário inválido (use HH:mm).";

  const name = typeof b.customerName === "string" ? b.customerName.trim().replace(/\s+/g, " ") : "";
  if (name.length < 2) fields.customerName = "Informe seu nome.";
  else if (name.length > 80) fields.customerName = "Nome muito longo.";

  const phone = parsePhoneBR(b.customerPhone);
  if (!phone) fields.customerPhone = PHONE_MESSAGE;

  let notes: string | null = null;
  if (b.notes !== undefined && b.notes !== null) {
    if (typeof b.notes !== "string") fields.notes = "Observação inválida.";
    else if (b.notes.trim().length > 300) fields.notes = "Use no máximo 300 caracteres.";
    else notes = b.notes.trim() || null;
  }

  if (Object.keys(fields).length) return { ok: false, fields };
  return {
    ok: true,
    value: {
      serviceId: b.serviceId as string,
      date: b.date as string,
      time: b.time as string,
      customerName: name,
      customerPhoneE164: phone!,
      notes,
    },
  };
}

export interface ServiceInput {
  name: string;
  categoryId: string;
  subcategory: string | null;
  durationMin: number;
  priceCents: number | null;
  professionalId: string;
  active: boolean;
}

/** Valida criação (partial=false) ou edição parcial (partial=true) de serviço. */
export function validateServiceInput(body: unknown, partial: boolean): Result<Partial<ServiceInput>> {
  const b = (body ?? {}) as Record<string, unknown>;
  const fields: Record<string, string> = {};
  const out: Partial<ServiceInput> = {};
  const has = (k: string) => b[k] !== undefined;

  if (has("name") || !partial) {
    const n = typeof b.name === "string" ? b.name.trim() : "";
    if (n.length < 2 || n.length > 60) fields.name = "Informe o nome do serviço (2 a 60 caracteres).";
    else out.name = n;
  }
  if (has("categoryId") || !partial) {
    if (typeof b.categoryId !== "string" || !b.categoryId) fields.categoryId = "Escolha a categoria.";
    else out.categoryId = b.categoryId;
  }
  if (has("subcategory")) {
    if (b.subcategory === null || b.subcategory === "") out.subcategory = null;
    else if (typeof b.subcategory !== "string" || b.subcategory.trim().length > 60)
      fields.subcategory = "Subcategoria inválida.";
    else out.subcategory = b.subcategory.trim();
  }
  if (has("durationMin") || !partial) {
    const e = validateDuration(b.durationMin);
    if (e) fields.durationMin = e;
    else out.durationMin = b.durationMin as number;
  }
  if (has("priceCents") || !partial) {
    const v = b.priceCents === undefined ? null : b.priceCents;
    const e = validatePriceCents(v);
    if (e) fields.priceCents = e;
    else out.priceCents = v as number | null;
  }
  if (has("professionalId") || !partial) {
    if (typeof b.professionalId !== "string" || !b.professionalId) fields.professionalId = "Escolha a profissional.";
    else out.professionalId = b.professionalId;
  }
  if (has("active")) {
    if (typeof b.active !== "boolean") fields.active = "Valor inválido.";
    else out.active = b.active;
  } else if (!partial) out.active = true;

  if (Object.keys(fields).length) return { ok: false, fields };
  return { ok: true, value: out };
}
