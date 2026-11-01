import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createSessionToken, passwordMatches, verifySessionToken } from "./auth";

beforeEach(() => {
  process.env.ADMIN_PASSWORD = "segredo";
});
afterEach(() => {
  delete process.env.ADMIN_PASSWORD;
});

describe("sessão admin", () => {
  it("confere senha", async () => {
    expect(await passwordMatches("segredo")).toBe(true);
    expect(await passwordMatches("errada")).toBe(false);
  });
  it("token válido por 12 h, adulterado ou expirado é recusado", async () => {
    const now = Date.now();
    const t = await createSessionToken(now);
    expect(await verifySessionToken(t, now)).toBe(true);
    expect(await verifySessionToken(t, now + 13 * 3600 * 1000)).toBe(false);
    const [exp, sig] = t.split(".");
    expect(await verifySessionToken(`${Number(exp) + 999}.${sig}`, now)).toBe(false);
    expect(await verifySessionToken(undefined, now)).toBe(false);
  });
  it("trocar a senha invalida sessões antigas", async () => {
    const t = await createSessionToken();
    process.env.ADMIN_PASSWORD = "nova";
    expect(await verifySessionToken(t)).toBe(false);
  });
});
