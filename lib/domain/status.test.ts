import { describe, expect, it } from "vitest";
import { conflictOf, nextStatus } from "./status";

describe("transições", () => {
  it("permite apenas o ciclo definido", () => {
    expect(nextStatus("pending", "confirm")).toBe("confirmed");
    expect(nextStatus("pending", "reject")).toBe("rejected");
    expect(nextStatus("confirmed", "cancel")).toBe("cancelled");
    expect(nextStatus("cancelled", "confirm")).toBeNull();
    expect(nextStatus("pending", "cancel")).toBeNull();
    expect(nextStatus("rejected", "confirm")).toBeNull();
  });
});

describe("conflitos", () => {
  const base = { professionalId: "stefani", date: "2026-11-06", time: "11:00", durationMin: 30 };
  it("dois pendentes no mesmo horário: aviso de pendente", () => {
    const a = { ...base, id: "a", status: "pending" as const };
    const b = { ...base, id: "b", status: "pending" as const };
    expect(conflictOf(a, [a, b])).toBe("pending");
  });
  it("após confirmar um, o outro fica bloqueado", () => {
    const a = { ...base, id: "a", status: "confirmed" as const };
    const b = { ...base, id: "b", status: "pending" as const };
    expect(conflictOf(b, [a, b])).toBe("confirmed");
    expect(conflictOf(a, [a, b])).toBeNull();
  });
  it("outra profissional ou horário adjacente não conflita", () => {
    const a = { ...base, id: "a", status: "confirmed" as const };
    const other = { ...base, id: "b", professionalId: "michele", status: "pending" as const };
    const next = { ...base, id: "c", time: "11:30", status: "pending" as const };
    expect(conflictOf(other, [a, other])).toBeNull();
    expect(conflictOf(next, [a, next])).toBeNull();
  });
});
