import { describe, expect, it } from "vitest";
import { availableDays, availableSlots, daySlots, type Busy } from "./availability";

const NOW = new Date("2026-11-01T11:00:00Z"); // domingo 08:00 SP
const FRI = "2026-11-06";

// "Manicure + Pedicure" (1 h) confirmado com Stéfani às 10:00.
const stefaniBusy: Busy[] = [{ date: FRI, time: "10:00", durationMin: 60 }];

describe("disponibilidade por profissional", () => {
  it("confirmado bloqueia a mesma profissional", () => {
    const manicure = availableSlots(30, FRI, stefaniBusy, NOW);
    expect(manicure).not.toContain("10:00");
    expect(manicure).not.toContain("10:30");
    expect(manicure).toContain("09:30");
    expect(manicure).toContain("11:00");
    const combo = availableSlots(60, FRI, stefaniBusy, NOW);
    expect(combo).not.toContain("09:30");
    expect(combo).toContain("09:00");
  });

  it("outra profissional continua livre (busy é por profissional)", () => {
    const micheleBusy: Busy[] = [];
    expect(availableSlots(60, FRI, micheleBusy, NOW)).toContain("10:00");
  });

  it("pendente não bloqueia: só confirmados entram em busy", () => {
    // O chamador passa apenas confirmados; sem confirmados, 11:00 segue livre.
    expect(availableSlots(30, FRI, [], NOW)).toContain("11:00");
  });

  it("ocupado em outro dia não afeta", () => {
    expect(availableSlots(30, "2026-11-07", stefaniBusy, NOW)).toContain("10:00");
  });
});

describe("dias", () => {
  it("marca domingo fechado e dia lotado sem horários", () => {
    const fullDay: Busy[] = [{ date: FRI, time: "09:00", durationMin: 660 }];
    const days = availableDays(30, "2026-11-01", 7, fullDay, NOW);
    expect(days[0]).toEqual({ date: "2026-11-01", open: false, hasSlots: false });
    expect(days.find((d) => d.date === FRI)).toEqual({ date: FRI, open: true, hasSlots: false });
    expect(days.find((d) => d.date === "2026-11-05")?.hasSlots).toBe(true);
  });
});

describe("horários ocupados (show-taken-slots)", () => {
  const manicure11: Busy[] = [{ date: FRI, time: "11:00", durationMin: 30 }];

  it("confirmado aparece como ocupado e sai dos livres", () => {
    const d = daySlots(30, FRI, manicure11, NOW);
    expect(d.taken).toEqual(["11:00"]);
    expect(d.free).not.toContain("11:00");
  });

  it("serviço de 1 h ocupa também o início anterior", () => {
    expect(daySlots(60, FRI, manicure11, NOW).taken).toEqual(["10:30", "11:00"]);
  });

  it("pendente não ocupa: sem confirmados, nada ocupado e livres iguais a availableSlots", () => {
    const d = daySlots(30, FRI, [], NOW);
    expect(d.taken).toEqual([]);
    expect(d.free).toEqual(availableSlots(30, FRI, [], NOW));
  });

  it("horário que já passou fica fora das duas listas", () => {
    const fri1410 = new Date("2026-11-06T17:10:00Z"); // sexta 14:10 SP
    const d = daySlots(30, FRI, [{ date: FRI, time: "10:00", durationMin: 30 }], fri1410);
    expect(d.taken).toEqual([]);
    expect(d.free[0]).toBe("14:30");
  });

  it("dia fechado vem vazio", () => {
    expect(daySlots(30, "2026-11-08", [{ date: "2026-11-08", time: "10:00", durationMin: 30 }], NOW)).toEqual({
      free: [],
      taken: [],
    });
  });
});
