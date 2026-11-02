import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authenticate, createSessionToken, loginEnabled, sessionFor, verifySessionToken } from "./auth";
import { resetStore } from "./store";

beforeEach(() => {
  resetStore();
  process.env.ADMIN_PASSWORD = "segredo";
  process.env.ADMIN_USERS = "stefani:unhas;lorrayne:trancas;maria:x";
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  delete process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_USERS;
  vi.restoreAllMocks();
});

describe("login", () => {
  it("confere usuário (sem diferenciar maiúsculas) e senha", async () => {
    expect(await authenticate("master", "segredo")).toBe("master");
    expect(await authenticate(" Stefani ", "unhas")).toBe("stefani");
    expect(await authenticate("stefani", "trancas")).toBeNull();
    expect(await authenticate("lorrayne", "unhas")).toBeNull();
  });

  it("usuário inexistente ou sem profissional cadastrada é recusado", async () => {
    expect(await authenticate("michele", "")).toBeNull();
    expect(await authenticate("maria", "x")).toBeNull();
  });

  it("sem nenhuma conta, login fica desabilitado", async () => {
    expect(await loginEnabled()).toBe(true);
    delete process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_USERS;
    expect(await loginEnabled()).toBe(false);
  });

  it("sem ADMIN_PASSWORD, master fica desabilitado e profissionais seguem", async () => {
    delete process.env.ADMIN_PASSWORD;
    expect(await authenticate("master", "")).toBeNull();
    expect(await authenticate("stefani", "unhas")).toBe("stefani");
  });
});

describe("sessão", () => {
  it("token válido por 12 h; adulterado ou expirado é recusado", async () => {
    const now = Date.now();
    const t = await createSessionToken("stefani", now);
    expect(await verifySessionToken(t, now)).toBe("stefani");
    expect(await verifySessionToken(t, now + 13 * 3600 * 1000)).toBeNull();
    const [sub, exp, sig] = t.split(".");
    expect(await verifySessionToken(`${sub}.${Number(exp) + 999}.${sig}`, now)).toBeNull();
    expect(await verifySessionToken(undefined, now)).toBeNull();
  });

  it("token de uma conta adulterado para outra é recusado", async () => {
    const t = await createSessionToken("stefani");
    const [, exp, sig] = t.split(".");
    expect(await verifySessionToken(`lorrayne.${exp}.${sig}`)).toBeNull();
    expect(await verifySessionToken(`master.${exp}.${sig}`)).toBeNull();
  });

  it("trocar a senha de uma conta invalida só as sessões dela", async () => {
    const s = await createSessionToken("stefani");
    const l = await createSessionToken("lorrayne");
    process.env.ADMIN_USERS = "stefani:nova;lorrayne:trancas";
    expect(await verifySessionToken(s)).toBeNull();
    expect(await verifySessionToken(l)).toBe("lorrayne");
  });

  it("monta a sessão com perfil e nome", async () => {
    expect(await sessionFor("master")).toEqual({ role: "master", professionalId: null, name: "", whatsappPhone: null });
    expect(await sessionFor("lorrayne")).toEqual({
      role: "professional",
      professionalId: "lorrayne",
      name: "Lorrayne Longobuco",
      whatsappPhone: null,
    });
    expect(await sessionFor("maria")).toBeNull();
  });
});
