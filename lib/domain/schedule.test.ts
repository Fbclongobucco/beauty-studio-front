import { describe, expect, it } from "vitest";
import { addDays, gridStarts, isDateString, isWorkDay, nowInSalon, windowEnd, fromMinutes } from "./schedule";
import { availableSlots } from "./availability";

// Domingo, 01/11/2026, 08:00 em São Paulo (11:00 UTC).
const SUNDAY_8AM = new Date("2026-11-01T11:00:00Z");

describe("grade e expediente", () => {
  it("último horário depende da duração", () => {
    expect(fromMinutes(gridStarts(30).at(-1)!)).toBe("19:30");
    expect(fromMinutes(gridStarts(120).at(-1)!)).toBe("18:00");
    expect(fromMinutes(gridStarts(420).at(-1)!)).toBe("13:00");
    expect(fromMinutes(gridStarts(30)[0])).toBe("09:00");
  });

  it("domingo fechado, segunda a sábado abertos", () => {
    expect(isWorkDay("2026-11-01")).toBe(false); // domingo
    expect(isWorkDay("2026-11-02")).toBe(true); // segunda
    expect(isWorkDay("2026-11-07")).toBe(true); // sábado
  });

  it("serviço de 7 h vai de 09:00 a 13:00", () => {
    const slots = availableSlots(420, "2026-11-06", [], SUNDAY_8AM);
    expect(slots[0]).toBe("09:00");
    expect(slots.at(-1)).toBe("13:00");
  });

  it("domingo não tem horários", () => {
    expect(availableSlots(30, "2026-11-08", [], SUNDAY_8AM)).toEqual([]);
  });
});

describe("fuso e janela", () => {
  it("usa o horário de São Paulo, não o da máquina", () => {
    expect(nowInSalon(new Date("2026-11-03T02:30:00Z"))).toEqual({ date: "2026-11-02", minutes: 23 * 60 + 30 });
  });

  it("hoje às 14:10 → primeiro horário 14:30", () => {
    const monday1410 = new Date("2026-11-02T17:10:00Z");
    expect(availableSlots(30, "2026-11-02", [], monday1410)[0]).toBe("14:30");
  });

  it("dias passados e além de 30 dias não têm horários", () => {
    expect(availableSlots(30, "2026-10-31", [], SUNDAY_8AM)).toEqual([]);
    expect(windowEnd("2026-11-01")).toBe("2026-12-01");
    expect(availableSlots(30, "2026-12-01", [], SUNDAY_8AM).length).toBeGreaterThan(0); // terça
    expect(availableSlots(30, "2026-12-02", [], SUNDAY_8AM)).toEqual([]);
  });

  it("valida datas", () => {
    expect(isDateString("2026-02-30")).toBe(false);
    expect(isDateString("2026-11-06")).toBe(true);
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});
