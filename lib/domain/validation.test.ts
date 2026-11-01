import { describe, expect, it } from "vitest";
import { parsePhoneBR, parsePriceBRL, validateBooking, validateDuration, validateServiceInput, PHONE_MESSAGE } from "./validation";

describe("telefone", () => {
  it("rejeita sem DDD e normaliza para E.164", () => {
    expect(parsePhoneBR("9681-7976")).toBeNull();
    expect(parsePhoneBR("(21) 96811-7976")).toBe("+5521968117976");
    expect(parsePhoneBR("+55 21 96811-7976")).toBe("+5521968117976");
    expect(parsePhoneBR("(21) 2650-1234")).toBe("+552126501234");
    expect(parsePhoneBR("(21) 86811-7976")).toBeNull();
  });
});

describe("preço", () => {
  it("converte reais para centavos e rejeita negativos e texto", () => {
    expect(parsePriceBRL("45,00")).toBe(4500);
    expect(parsePriceBRL("R$ 1.234,56")).toBe(123456);
    expect(parsePriceBRL("45")).toBe(4500);
    expect(parsePriceBRL("45.5")).toBe(4550);
    expect(parsePriceBRL("-10")).toBeNull();
    expect(parsePriceBRL("abc")).toBeNull();
    expect(parsePriceBRL("")).toBeNull();
  });
});

describe("duração", () => {
  it("exige múltiplo de 30 entre 30 e 480", () => {
    expect(validateDuration(45)).toMatch(/múltiplo de 30/);
    expect(validateDuration(0)).not.toBeNull();
    expect(validateDuration(510)).not.toBeNull();
    expect(validateDuration(90)).toBeNull();
  });
});

describe("pedido", () => {
  const ok = { serviceId: "s1", date: "2026-11-06", time: "15:00", customerName: " Maria  da Silva ", customerPhone: "(21) 96811-7976" };
  it("aceita dados válidos", () => {
    const r = validateBooking(ok);
    expect(r.ok && r.value).toMatchObject({ customerName: "Maria da Silva", customerPhoneE164: "+5521968117976", notes: null });
  });
  it("lista campos inválidos", () => {
    const r = validateBooking({ ...ok, customerPhone: "9681-7976", date: "06/11/2026" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.fields.customerPhone).toBe(PHONE_MESSAGE);
      expect(r.fields.date).toBeDefined();
    }
  });
  it("limita observação a 300 caracteres", () => {
    const r = validateBooking({ ...ok, notes: "x".repeat(301) });
    expect(r.ok).toBe(false);
  });
});

describe("serviço", () => {
  it("rejeita preço negativo e duração de 45 min", () => {
    const r = validateServiceInput({ durationMin: 45, priceCents: -100 }, true);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.fields.durationMin).toMatch(/múltiplo de 30/);
      expect(r.fields.priceCents).toBe("Informe um valor em reais, ex.: 45,00");
    }
  });
  it("criação exige campos obrigatórios", () => {
    const r = validateServiceInput({}, false);
    expect(r.ok).toBe(false);
  });
});
