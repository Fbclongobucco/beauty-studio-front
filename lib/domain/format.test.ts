import { describe, expect, it } from "vitest";
import { formatDateLong, formatDuration, formatPhone, formatPrice, maskPhoneInput, centsToInput } from "./format";

describe("formatadores pt-BR", () => {
  it("preço", () => {
    expect(formatPrice(123456)).toBe("R$ 1.234,56");
    expect(formatPrice(2000)).toBe("R$ 20,00");
    expect(formatPrice(null)).toBe("Consultar valor");
    expect(centsToInput(4500)).toBe("45,00");
  });
  it("duração por extenso", () => {
    expect(formatDuration(30)).toBe("30 minutos");
    expect(formatDuration(60)).toBe("1 hora");
    expect(formatDuration(90)).toBe("1 hora e 30 minutos");
    expect(formatDuration(360)).toBe("6 horas");
  });
  it("data por extenso", () => {
    expect(formatDateLong("2026-11-06")).toBe("sexta-feira, 6 de novembro");
  });
  it("telefone", () => {
    expect(formatPhone("+5521968117976")).toBe("(21) 96811-7976");
    expect(maskPhoneInput("21968117976")).toBe("(21) 96811-7976");
    expect(maskPhoneInput("2196")).toBe("(21) 96");
  });
});
