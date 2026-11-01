import { afterEach, describe, expect, it, vi } from "vitest";
import { accountIds, accountPassword, normalizeUser, parseUsers, warnUnknown } from "./accounts";

afterEach(() => {
  delete process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_USERS;
  vi.restoreAllMocks();
});

describe("contas do ambiente", () => {
  it("divide cada entrada no primeiro ':' (senha pode conter ':')", () => {
    const m = parseUsers("stefani:a:b:c; Lorrayne :xyz");
    expect(m.get("stefani")).toBe("a:b:c");
    expect(m.get("lorrayne")).toBe("xyz");
  });

  it("ignora entradas malformadas e o usuário reservado master", () => {
    const m = parseUsers("semdoispontos;:senha;michele:;master:x;;");
    expect([...m.keys()]).toEqual([]);
  });

  it("variáveis vazias: nenhuma conta", () => {
    expect(accountIds()).toEqual([]);
    expect(accountPassword("master")).toBeNull();
    process.env.ADMIN_PASSWORD = "";
    expect(accountIds()).toEqual([]);
  });

  it("master vem de ADMIN_PASSWORD; profissionais de ADMIN_USERS", () => {
    process.env.ADMIN_PASSWORD = "m";
    process.env.ADMIN_USERS = "stefani:s";
    expect(accountIds()).toEqual(["master", "stefani"]);
    expect(accountPassword("master")).toBe("m");
    expect(accountPassword("stefani")).toBe("s");
    expect(accountPassword("lorrayne")).toBeNull();
  });

  it("normaliza usuário", () => {
    expect(normalizeUser("  Stefani ")).toBe("stefani");
  });

  it("avisa uma vez sobre id sem profissional", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnUnknown(["master", "stefani", "maria"], ["stefani"]);
    warnUnknown(["maria"], ["stefani"]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('"maria"');
  });
});
