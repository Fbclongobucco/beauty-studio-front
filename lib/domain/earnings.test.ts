import { describe, expect, it } from "vitest";
import { computeEarnings, validateEarningsPeriod } from "./earnings";
import { isDateString } from "./schedule";
import type { Appointment, AppointmentStatus } from "./types";

let n = 0;
function appt(p: {
  service: string;
  price: number | null;
  date: string;
  time?: string;
  durationMin?: number;
  status?: AppointmentStatus;
  prof?: string;
}): Appointment {
  const time = p.time ?? "10:00";
  const dur = p.durationMin ?? 60;
  const [h, m] = time.split(":").map(Number);
  const end = h * 60 + m + dur;
  const endTime = `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
  return {
    id: String(++n),
    serviceId: p.service,
    professionalId: p.prof ?? "stefani",
    serviceName: p.service,
    professionalName: p.prof === "lorrayne" ? "Lorrayne Longobuco" : "Stéfani Longo Bucco",
    durationMin: dur,
    priceCents: p.price,
    date: p.date,
    time,
    startISO: `${p.date}T${time}:00-03:00`,
    endISO: `${p.date}T${endTime}:00-03:00`,
    customerName: "Maria",
    customerPhoneE164: "+5521968117976",
    notes: null,
    status: p.status ?? "confirmed",
    createdAt: "2026-10-01T00:00:00Z",
    confirmedAt: null,
    rejectedAt: null,
    cancelledAt: null,
    reason: null,
    seenByAdminAt: null,
  };
}

const NOV = { from: "2026-11-01", to: "2026-11-30" };
const MID = new Date("2026-11-15T12:00:00-03:00");

describe("ganhos", () => {
  it("só confirmados entram; cancelado fica fora", () => {
    const r = computeEarnings(
      [
        appt({ service: "Manicure", price: 2000, date: "2026-11-03" }),
        appt({ service: "Manicure", price: 2000, date: "2026-11-04" }),
        appt({ service: "Pedicure", price: 2500, date: "2026-11-05", status: "cancelled" }),
        appt({ service: "Pedicure", price: 2500, date: "2026-11-05", status: "pending" }),
      ],
      { ...NOV, now: MID },
    );
    expect(r.total).toEqual({ cents: 4000, count: 2 });
  });

  it("serviço sem preço fica fora da soma e é contado à parte", () => {
    const r = computeEarnings(
      [appt({ service: "Manicure", price: 2000, date: "2026-11-03" }), appt({ service: "Avaliação", price: null, date: "2026-11-03" })],
      { ...NOV, now: MID },
    );
    expect(r.total).toEqual({ cents: 2000, count: 1 });
    expect(r.unpriced).toBe(1);
    expect(r.byService.map((s) => s.name)).toEqual(["Manicure"]);
  });

  it("usa o preço gravado no agendamento", () => {
    // O agendamento guarda R$ 20,00 mesmo que o catálogo passe a R$ 25,00.
    const r = computeEarnings([appt({ service: "Manicure", price: 2000, date: "2026-11-03" })], { ...NOV, now: MID });
    expect(r.total.cents).toBe(2000);
  });

  it("divide realizado (já terminou) e previsto", () => {
    const r = computeEarnings(
      [
        appt({ service: "Box braids", price: 19000, date: "2026-11-11", time: "09:00", durationMin: 360, prof: "lorrayne" }),
        appt({ service: "Ghana braids", price: 16000, date: "2026-11-18", prof: "lorrayne" }),
        // Termina 12:30 no dia 15: ainda não terminou às 12:00 → previsto.
        appt({ service: "Manicure", price: 2000, date: "2026-11-15", time: "12:00", durationMin: 30 }),
      ],
      { ...NOV, now: MID },
    );
    expect(r.realized).toEqual({ cents: 19000, count: 1 });
    expect(r.expected).toEqual({ cents: 18000, count: 2 });
    expect(r.total).toEqual({ cents: 37000, count: 3 });
  });

  it("ordena serviços e profissionais do maior para o menor valor", () => {
    const r = computeEarnings(
      [
        appt({ service: "Manicure", price: 2000, date: "2026-11-03" }),
        appt({ service: "Manicure", price: 2000, date: "2026-11-04" }),
        appt({ service: "Manicure", price: 2000, date: "2026-11-05" }),
        appt({ service: "Fibra de vidro", price: 13500, date: "2026-11-06" }),
        appt({ service: "Ghana braids", price: 16000, date: "2026-11-06", prof: "lorrayne" }),
      ],
      { ...NOV, now: MID },
    );
    expect(r.byService.slice(0, 2)).toEqual([
      { name: "Ghana braids", count: 1, cents: 16000 },
      { name: "Fibra de vidro", count: 1, cents: 13500 },
    ]);
    expect(r.byService[2]).toEqual({ name: "Manicure", count: 3, cents: 6000 });
    expect(r.byProfessional.map((p) => [p.professionalId, p.cents, p.count])).toEqual([
      ["stefani", 19500, 4],
      ["lorrayne", 16000, 1],
    ]);
  });

  it("série por dia cobre os dias úteis do período", () => {
    const r = computeEarnings([appt({ service: "Manicure", price: 2000, date: "2026-11-03" })], {
      from: "2026-11-02",
      to: "2026-11-08",
      now: MID,
    });
    expect(r.byDay.map((d) => d.date)).toEqual(["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07"]);
    expect(r.byDay[1]).toEqual({ date: "2026-11-03", realizedCents: 2000, expectedCents: 0 });
  });

  it("valida o período", () => {
    expect(validateEarningsPeriod("2026-11-01", "2026-11-30", isDateString)).toBeNull();
    expect(validateEarningsPeriod("2026-11-20", "2026-11-10", isDateString)).toEqual({
      to: "A data final deve ser depois da inicial",
    });
    expect(validateEarningsPeriod("2026-01-01", "2027-01-02", isDateString)).toEqual({ to: "O período pode ter no máximo 366 dias." });
    expect(validateEarningsPeriod("2026-01-01", "2027-01-01", isDateString)).toBeNull();
    expect(validateEarningsPeriod(null, "x", isDateString)).toHaveProperty("from");
  });
});
