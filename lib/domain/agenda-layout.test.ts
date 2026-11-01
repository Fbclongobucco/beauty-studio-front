import { describe, expect, it } from "vitest";
import { GRID_ROWS, layoutDay } from "./agenda-layout";
import { weekStart } from "./schedule";

describe("semana", () => {
  it("começa na segunda; domingo vai para a segunda anterior", () => {
    expect(weekStart("2026-11-04")).toBe("2026-11-02"); // quarta
    expect(weekStart("2026-11-02")).toBe("2026-11-02"); // segunda
    expect(weekStart("2026-11-07")).toBe("2026-11-02"); // sábado
    expect(weekStart("2026-11-01")).toBe("2026-10-26"); // domingo
  });
});

describe("layout da grade", () => {
  it("22 linhas de 30 min das 09:00 às 20:00", () => {
    expect(GRID_ROWS).toBe(22);
  });

  it("bloco de 6 h às 09:00 ocupa 12 linhas a partir da primeira", () => {
    expect(layoutDay([{ id: "a", time: "09:00", durationMin: 360 }])).toEqual([
      { id: "a", row: 1, span: 12, lane: 0, lanes: 1 },
    ]);
  });

  it("dois simultâneos ficam lado a lado", () => {
    const r = layoutDay([
      { id: "s", time: "10:00", durationMin: 60 },
      { id: "m", time: "10:00", durationMin: 60 },
    ]);
    expect(r.map((b) => [b.id, b.lane, b.lanes])).toEqual([
      ["s", 0, 2],
      ["m", 1, 2],
    ]);
  });

  it("três sobrepostos em cadeia; bloco separado depois volta a uma faixa", () => {
    const r = layoutDay([
      { id: "a", time: "09:00", durationMin: 120 }, // 09–11
      { id: "b", time: "10:00", durationMin: 60 }, // 10–11
      { id: "c", time: "10:30", durationMin: 60 }, // 10:30–11:30
      { id: "d", time: "11:30", durationMin: 30 }, // depois do grupo
    ]);
    const by = Object.fromEntries(r.map((b) => [b.id, b]));
    expect([by.a.lane, by.b.lane, by.c.lane]).toEqual([0, 1, 2]);
    expect(by.a.lanes).toBe(3);
    expect(by.d).toMatchObject({ row: 6, lane: 0, lanes: 1 });
  });

  it("reaproveita faixa liberada dentro do grupo", () => {
    const r = layoutDay([
      { id: "a", time: "09:00", durationMin: 180 }, // 09–12
      { id: "b", time: "09:00", durationMin: 60 }, // 09–10
      { id: "c", time: "10:00", durationMin: 60 }, // 10–11, usa a faixa de b
    ]);
    const by = Object.fromEntries(r.map((b) => [b.id, b]));
    expect(by.c.lane).toBe(1);
    expect(by.a.lanes).toBe(2);
  });
});
