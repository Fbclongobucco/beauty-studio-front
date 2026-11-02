import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as accounts from "@/app/api/admin/accounts/route";
import * as appointments from "@/app/api/admin/appointments/route";
import * as action from "@/app/api/admin/appointments/[id]/[action]/route";
import * as markSeen from "@/app/api/admin/appointments/mark-seen/route";
import * as pendingCount from "@/app/api/admin/appointments/pending-count/route";
import * as categories from "@/app/api/admin/categories/route";
import * as category from "@/app/api/admin/categories/[id]/route";
import * as earnings from "@/app/api/admin/earnings/route";
import * as login from "@/app/api/admin/login/route";
import * as logout from "@/app/api/admin/logout/route";
import * as me from "@/app/api/admin/me/route";
import * as professionals from "@/app/api/admin/professionals/route";
import * as services from "@/app/api/admin/services/route";
import * as service from "@/app/api/admin/services/[id]/route";
import * as servicePhoto from "@/app/api/admin/services/[id]/photo/route";
import * as photoFile from "@/app/api/service-photos/[photoId]/route";
import * as publicServices from "@/app/api/services/route";
import * as availability from "@/app/api/availability/route";
import * as createAppt from "@/app/api/appointments/route";
import * as apptStatus from "@/app/api/appointments/[id]/route";
import * as mine from "@/app/api/appointments/mine/route";
import { resetMemoryAccounts } from "./accounts";
import { createSessionToken, SESSION_COOKIE } from "./auth";
import { repo } from "./repository";
import { resetStore } from "./store";

// `connection()` exige escopo de requisição do Next; nos testes, as rotas públicas rodam fora dele.
vi.mock("next/server", async (orig) => ({ ...(await orig<typeof import("next/server")>()), connection: async () => {} }));

type Handler = (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>;

/** Todas as rotas admin. Rota nova sem entrada aqui faz o teste de cobertura falhar. */
const ROUTES: Record<string, { mod: Record<string, unknown>; params?: Record<string, string>; public?: boolean }> = {
  "accounts": { mod: accounts },
  "appointments": { mod: appointments },
  "appointments/[id]/[action]": { mod: action, params: { id: "x", action: "confirm" } },
  "appointments/mark-seen": { mod: markSeen },
  "appointments/pending-count": { mod: pendingCount },
  "categories": { mod: categories },
  "categories/[id]": { mod: category, params: { id: "unhas" } },
  "earnings": { mod: earnings },
  "login": { mod: login, public: true },
  "logout": { mod: logout, public: true },
  "me": { mod: me },
  "professionals": { mod: professionals },
  "services": { mod: services },
  "services/[id]": { mod: service, params: { id: "manicure" } },
  "services/[id]/photo": { mod: servicePhoto, params: { id: "manicure" } },
};

const FRI = "2026-11-06";
const NOW = new Date("2026-11-01T11:00:00Z");
const customer = { customerName: "Maria", customerPhoneE164: "+5521968117976", notes: null };

beforeEach(() => {
  resetStore();
  resetMemoryAccounts();
  process.env.ADMIN_PASSWORD = "segredo";
  process.env.ADMIN_USERS = "stefani:unhas;lorrayne:trancas;michele:depil";
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  delete process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_USERS;
  delete process.env.ADMIN_USERNAME;
  vi.restoreAllMocks();
});

async function call(
  mod: Record<string, unknown>,
  method: string,
  opts: { as?: string; query?: string; body?: unknown; form?: FormData; params?: Record<string, string> } = {},
) {
  const headers: Record<string, string> = {};
  if (opts.as) headers.cookie = `${SESSION_COOKIE}=${await createSessionToken(opts.as)}`;
  if (opts.body !== undefined) headers["content-type"] = "application/json";
  const req = new NextRequest(`http://localhost/api/admin/x${opts.query ? `?${opts.query}` : ""}`, {
    method,
    headers,
    body: opts.form ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
  });
  const res = await (mod[method] as Handler)(req, { params: Promise.resolve(opts.params ?? {}) });
  return { status: res.status, body: await res.json(), res };
}

async function book(serviceId: string, time = "11:00") {
  const r = await repo.createAppointment({ serviceId, date: FRI, time, ...customer }, NOW);
  if (!r.ok) throw new Error(r.reason);
  return r.appointment;
}

describe("cobertura de escopo", () => {
  it("toda rota em app/api/admin está na lista e exige sessão", async () => {
    const root = path.resolve(__dirname, "../../app/api/admin");
    const found: string[] = [];
    const walk = (dir: string) => {
      for (const f of readdirSync(dir)) {
        const full = path.join(dir, f);
        if (statSync(full).isDirectory()) walk(full);
        else if (f === "route.ts") found.push(path.relative(root, dir).split(path.sep).join("/"));
      }
    };
    walk(root);
    expect(found.sort()).toEqual(Object.keys(ROUTES).sort());

    for (const [name, r] of Object.entries(ROUTES)) {
      if (r.public) continue;
      for (const method of ["GET", "POST", "PATCH", "PUT", "DELETE"]) {
        if (typeof r.mod[method] !== "function") continue;
        const { status } = await call(r.mod, method, { params: r.params, body: method === "GET" ? undefined : {} });
        expect(status, `${method} ${name}`).toBe(401);
      }
    }
  });
});

describe("login e sessão", () => {
  it("login por usuário; mensagem única para usuário inexistente e senha errada", async () => {
    const ok = await call(login, "POST", { body: { username: "Lorrayne", password: "trancas" } });
    expect(ok.status).toBe(200);
    expect(ok.res.headers.get("set-cookie")).toContain(`${SESSION_COOKIE}=lorrayne.`);
    const wrong = await call(login, "POST", { body: { username: "lorrayne", password: "x" } });
    const nobody = await call(login, "POST", { body: { username: "maria", password: "x" } });
    expect(wrong.status).toBe(401);
    expect(wrong.body.message).toBe("Usuário ou senha incorretos");
    expect(nobody.body).toEqual(wrong.body);
  });

  it("sem contas configuradas: 503 LOGIN_DISABLED", async () => {
    delete process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_USERS;
    const r = await call(login, "POST", { body: { username: "master", password: "" } });
    expect(r.status).toBe(503);
    expect(r.body.code).toBe("LOGIN_DISABLED");
  });

  it("me identifica a conta", async () => {
    expect((await call(me, "GET", { as: "lorrayne" })).body).toEqual({
      role: "professional",
      professionalId: "lorrayne",
      name: "Lorrayne Longobuco",
      whatsappPhone: null,
    });
    expect((await call(me, "GET", { as: "master" })).body.role).toBe("master");
  });
});

describe("agendamentos por perfil", () => {
  it("profissional vê só os dela e ignora filtro de outra", async () => {
    await book("manicure");
    await book("box-braids", "09:00");
    const r = await call(appointments, "GET", { as: "stefani", query: "professionalId=lorrayne" });
    expect(r.body.appointments.map((a: { serviceId: string }) => a.serviceId)).toEqual(["manicure"]);
    const m = await call(appointments, "GET", { as: "master", query: "professionalId=lorrayne" });
    expect(m.body.appointments.map((a: { serviceId: string }) => a.serviceId)).toEqual(["box-braids"]);
    const all = await call(appointments, "GET", { as: "master" });
    expect(all.body.appointments).toHaveLength(2);
  });

  it("aceita intervalo from/to e valida datas", async () => {
    await book("manicure");
    const r = await call(appointments, "GET", { as: "stefani", query: `from=2026-11-02&to=2026-11-07` });
    expect(r.body.appointments).toHaveLength(1);
    const bad = await call(appointments, "GET", { as: "stefani", query: "from=2026-13-01" });
    expect(bad.status).toBe(400);
  });

  it("ação em pedido de outra profissional responde 404 e não muda o pedido", async () => {
    const a = await book("box-braids", "09:00");
    const r = await call(action, "POST", { as: "michele", params: { id: a.id, action: "confirm" }, body: {} });
    expect(r.status).toBe(404);
    expect((await repo.getAppointment(a.id))?.status).toBe("pending");
    const ok = await call(action, "POST", { as: "lorrayne", params: { id: a.id, action: "confirm" }, body: {} });
    expect(ok.status).toBe(200);
  });

  it("contagem por profissional; master vê o salão e não marca visto", async () => {
    await book("manicure");
    await book("depilacao");
    expect((await call(pendingCount, "GET", { as: "stefani" })).body).toEqual({ pending: 1, unseen: 1 });
    expect((await call(pendingCount, "GET", { as: "master" })).body).toEqual({ pending: 2, unseen: 2 });
    expect((await call(markSeen, "POST", { as: "master", body: {} })).body).toEqual({ marked: 0 });
    expect((await call(pendingCount, "GET", { as: "stefani" })).body.unseen).toBe(1);
    expect((await call(markSeen, "POST", { as: "stefani", body: {} })).body).toEqual({ marked: 1 });
    expect((await call(pendingCount, "GET", { as: "michele" })).body.unseen).toBe(1);
  });
});

describe("catálogo por perfil", () => {
  it("profissional vê só os próprios serviços e a si mesma", async () => {
    const r = await call(services, "GET", { as: "michele" });
    expect(r.body.services.map((s: { id: string }) => s.id)).toEqual(["depilacao"]);
    expect(r.body.professionals.map((p: { id: string }) => p.id)).toEqual(["michele"]);
    expect(r.body.categories).toHaveLength(3);
    const p = await call(professionals, "GET", { as: "michele" });
    expect(p.body.professionals).toHaveLength(1);
    expect((await call(services, "GET", { as: "master" })).body.services).toHaveLength(21);
  });

  it("profissional cria serviço sempre em nome dela", async () => {
    const input = { name: "Spa dos pés", categoryId: "unhas", subcategory: "Cuidados básicos", durationMin: 60, priceCents: 4500 };
    const r = await call(services, "POST", { as: "stefani", body: input });
    expect(r.status).toBe(201);
    expect(r.body.professionalId).toBe("stefani");
    const other = await call(services, "POST", { as: "stefani", body: { ...input, professionalId: "lorrayne" } });
    expect(other.status).toBe(403);
  });

  it("edita só os próprios serviços e não transfere", async () => {
    const own = await call(service, "PATCH", { as: "stefani", params: { id: "manicure" }, body: { priceCents: 2500 } });
    expect(own.status).toBe(200);
    const alien = await call(service, "PATCH", { as: "stefani", params: { id: "box-braids" }, body: { priceCents: 1 } });
    expect(alien.status).toBe(404);
    const transfer = await call(service, "PATCH", {
      as: "lorrayne",
      params: { id: "box-braids" },
      body: { professionalId: "stefani" },
    });
    expect(transfer.status).toBe(403);
    expect(transfer.body.code).toBe("FORBIDDEN");
    expect((await repo.getService("box-braids"))?.professionalId).toBe("lorrayne");
    const master = await call(service, "PATCH", { as: "master", params: { id: "box-braids" }, body: { professionalId: "stefani" } });
    expect(master.status).toBe(200);
  });

  it("categorias e cadastro de profissional só para o master", async () => {
    const note = await call(category, "PATCH", { as: "stefani", params: { id: "unhas" }, body: { note: "x" } });
    expect(note.status).toBe(403);
    expect((await repo.listCategories()).find((c) => c.id === "unhas")?.note).not.toBe("x");
    expect((await call(categories, "POST", { as: "stefani", body: { name: "Cílios" } })).status).toBe(403);
    expect((await call(professionals, "POST", { as: "lorrayne", body: { name: "Ana Souza" } })).status).toBe(403);
    expect((await call(categories, "GET", { as: "lorrayne" })).status).toBe(200);
    expect((await call(category, "PATCH", { as: "master", params: { id: "unhas" }, body: { note: "y" } })).status).toBe(200);
    expect((await call(professionals, "POST", { as: "master", body: { name: "Ana Souza" } })).status).toBe(201);
  });
});

describe("ganhos por perfil", () => {
  it("valida o período", async () => {
    const r = await call(earnings, "GET", { as: "stefani", query: "from=2026-11-20&to=2026-11-10" });
    expect(r.status).toBe(400);
    expect(r.body.fields.to).toBe("A data final deve ser depois da inicial");
  });

  it("profissional vê só os próprios; master por profissional", async () => {
    const m = await book("manicure");
    const b = await book("box-braids", "09:00");
    await repo.transition(m.id, "confirm");
    await repo.transition(b.id, "confirm");
    const q = "from=2026-11-01&to=2026-11-30";
    const s = await call(earnings, "GET", { as: "stefani", query: `${q}&professionalId=lorrayne` });
    expect(s.body.total).toEqual({ cents: 2000, count: 1 });
    expect(s.body.byProfessional.map((p: { professionalId: string }) => p.professionalId)).toEqual(["stefani"]);
    const all = await call(earnings, "GET", { as: "master", query: q });
    expect(all.body.total).toEqual({ cents: 21000, count: 2 });
    expect(all.body.byProfessional).toHaveLength(2);
    const one = await call(earnings, "GET", { as: "master", query: `${q}&professionalId=lorrayne` });
    expect(one.body.total).toEqual({ cents: 19000, count: 1 });
  });
});

describe("contas", () => {
  it("ADMIN_USERNAME renomeia o login do master; \"master\" deixa de valer", async () => {
    process.env.ADMIN_USERNAME = "Admin";
    const ok = await call(login, "POST", { body: { username: "admin", password: "segredo" } });
    expect(ok.status).toBe(200);
    expect(ok.res.headers.get("set-cookie")).toContain(`${SESSION_COOKIE}=master.`);
    const old = await call(login, "POST", { body: { username: "master", password: "segredo" } });
    expect(old.status).toBe(401);
  });

  it("logins só para o master", async () => {
    expect((await call(accounts, "GET", { as: "stefani" })).status).toBe(403);
    const r = await call(accounts, "POST", { as: "stefani", body: { professionalId: "stefani", password: "123456" } });
    expect(r.status).toBe(403);
  });

  it("master cria login de nova profissional, que passa a entrar e ver só o dela", async () => {
    const p = await repo.createProfessional("Ana Souza");
    const before = await call(login, "POST", { body: { username: p.id, password: "ana123" } });
    expect(before.status).toBe(401);

    const curto = await call(accounts, "POST", { as: "master", body: { professionalId: p.id, password: "123" } });
    expect(curto.status).toBe(400);
    expect(curto.body.fields.password).toBeDefined();

    const r = await call(accounts, "POST", { as: "master", body: { professionalId: p.id, password: "ana123" } });
    expect(r.status).toBe(201);
    const list = await call(accounts, "GET", { as: "master" });
    expect(list.body.accounts.find((a: { professionalId: string }) => a.professionalId === p.id).login).toBe("memory");
    expect(JSON.stringify(list.body)).not.toContain("ana123");

    const ok = await call(login, "POST", { body: { username: p.id, password: "ana123" } });
    expect(ok.status).toBe(200);
    expect((await call(me, "GET", { as: p.id })).body).toMatchObject({ role: "professional", professionalId: p.id });
  });

  it("não altera login definido no ambiente nem cria para id inexistente", async () => {
    const env = await call(accounts, "POST", { as: "master", body: { professionalId: "stefani", password: "outra123" } });
    expect(env.status).toBe(400);
    expect(env.body.fields.professionalId).toContain("ADMIN_USERS");
    const none = await call(accounts, "POST", { as: "master", body: { professionalId: "maria", password: "123456" } });
    expect(none.status).toBe(400);
  });
});

describe("foto do serviço", () => {
  const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...new Array(800).fill(7)]);
  const form = (bytes: Uint8Array<ArrayBuffer>, name = "foto.jpg", type = "image/jpeg") => {
    const f = new FormData();
    f.append("photo", new File([bytes], name, { type }));
    return f;
  };
  const put = (as: string, id: string, f: FormData) => call(servicePhoto, "PUT", { as, params: { id }, form: f });
  const getFile = async (url: string) => {
    const photoId = url.split("/").pop()!;
    return photoFile.GET(new NextRequest(`http://localhost${url}`), { params: Promise.resolve({ photoId }) });
  };
  const publicPhotoOf = async (id: string) => {
    const body = await (await publicServices.GET()).json();
    return body.categories.flatMap((c: { services: { id: string; photoUrl: string | null }[] }) => c.services)
      .find((s: { id: string }) => s.id === id)?.photoUrl;
  };

  it("envio válido aparece no catálogo público e a imagem é servida com o tipo certo", async () => {
    const r = await put("lorrayne", "box-braids", form(JPEG));
    expect(r.status).toBe(200);
    expect(r.body.photoUrl).toMatch(/^\/api\/service-photos\//);
    expect(await publicPhotoOf("box-braids")).toBe(r.body.photoUrl);
    expect(await publicPhotoOf("manicure")).toBeNull();

    const file = await getFile(r.body.photoUrl);
    expect(file.status).toBe(200);
    expect(file.headers.get("content-type")).toBe("image/jpeg");
    expect(file.headers.get("cache-control")).toContain("immutable");
    expect(new Uint8Array(await file.arrayBuffer())).toEqual(JPEG);
  });

  it("troca muda a URL; remoção zera e a URL antiga responde 404", async () => {
    const a = await put("master", "manicure", form(JPEG));
    const b = await put("master", "manicure", form(JPEG));
    expect(b.body.photoUrl).not.toBe(a.body.photoUrl);
    expect((await getFile(a.body.photoUrl)).status).toBe(404);

    const del = await call(servicePhoto, "DELETE", { as: "master", params: { id: "manicure" } });
    expect(del.status).toBe(200);
    expect(del.body.photoUrl).toBeNull();
    expect((await getFile(b.body.photoUrl)).status).toBe(404);
    // Sem foto também responde 200.
    expect((await call(servicePhoto, "DELETE", { as: "master", params: { id: "manicure" } })).status).toBe(200);
  });

  it("recusa arquivo grande, PDF renomeado e campo ausente", async () => {
    const big = new Uint8Array(6 * 1024 * 1024);
    big.set([0xff, 0xd8, 0xff]);
    const r1 = await put("stefani", "manicure", form(big));
    expect(r1.status).toBe(400);
    expect(r1.body).toMatchObject({ code: "VALIDATION_ERROR", fields: { photo: "A foto deve ter no máximo 5 MB." } });

    const pdf = new TextEncoder().encode("%PDF-1.7 conteúdo");
    const r2 = await put("stefani", "manicure", form(pdf, "foto.jpg", "image/jpeg"));
    expect(r2.body.fields).toEqual({ photo: "Envie uma foto em JPEG, PNG ou WebP." });

    const r3 = await put("stefani", "manicure", new FormData());
    expect(r3.status).toBe(400);
    expect(r3.body.fields).toEqual({ photo: "Escolha uma foto." });
    expect((await repo.getService("manicure"))?.photoUrl).toBeNull();
  });

  it("serviço de outra profissional responde 404 e não muda a foto", async () => {
    const r = await put("michele", "manicure", form(JPEG));
    expect(r.status).toBe(404);
    const d = await call(servicePhoto, "DELETE", { as: "michele", params: { id: "manicure" } });
    expect(d.status).toBe(404);
    expect((await repo.getService("manicure"))?.photoUrl).toBeNull();
  });

  it("sem sessão responde 401", async () => {
    expect((await call(servicePhoto, "PUT", { params: { id: "manicure" }, form: form(JPEG) })).status).toBe(401);
    expect((await call(servicePhoto, "DELETE", { params: { id: "manicure" } })).status).toBe(401);
  });

  it("PATCH do serviço ignora photoUrl no corpo", async () => {
    const r = await call(service, "PATCH", { as: "master", params: { id: "manicure" }, body: { photoUrl: "https://x/y.jpg" } });
    expect(r.status).toBe(200);
    expect(r.body.photoUrl).toBeNull();
  });
});

describe("disponibilidade com horários ocupados (show-taken-slots)", () => {
  afterEach(() => vi.useRealTimers());

  it("confirmado vem em taken e sai de slots; pendente não ocupa", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: NOW });
    const confirmed = await book("manicure", "11:00");
    await repo.transition(confirmed.id, "confirm");
    await book("manicure", "15:00"); // pendente
    const r = await call(availability, "GET", { query: `serviceId=manicure&date=${FRI}` });
    expect(r.status).toBe(200);
    expect(r.body.taken).toEqual(["11:00"]);
    expect(r.body.slots).not.toContain("11:00");
    expect(r.body.slots).toContain("15:00");
    expect(JSON.stringify(r.body)).not.toContain("Maria");
  });
});

describe("acompanhamento do pedido (add-customer-request-tracking)", () => {
  afterEach(() => vi.useRealTimers());

  type Res = { status: number; body: { appointments?: { id: string; status: string }[]; id?: string }; cookie: string | null };

  async function hit(
    mod: Record<string, unknown>,
    method: string,
    opts: { cookie?: string | null; body?: unknown; params?: Record<string, string> } = {},
  ): Promise<Res> {
    const headers: Record<string, string> = {};
    if (opts.cookie) headers.cookie = opts.cookie;
    if (opts.body !== undefined) headers["content-type"] = "application/json";
    const req = new NextRequest("http://localhost/api/appointments", {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
    const res = await (mod[method] as Handler)(req, { params: Promise.resolve(opts.params ?? {}) });
    const set = res.headers.get("set-cookie");
    return { status: res.status, body: await res.json(), cookie: set ? set.split(";")[0] : null };
  }

  const order = (time: string, serviceId = "manicure", date = FRI) => ({
    serviceId,
    date,
    time,
    customerName: "Maria Souza",
    customerPhone: "(21) 98888-7777",
  });

  it("criar grava o cookie e /mine traz o pendente, sem dados da cliente no cookie", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: NOW });
    const a = await hit(createAppt, "POST", { body: order("11:00") });
    expect(a.status).toBe(201);
    expect(a.cookie).toMatch(/^my_requests=/);
    expect(Buffer.from(a.cookie!.split("=")[1].split(".")[0], "base64url").toString()).not.toContain("Maria");
    const m = await hit(mine, "GET", { cookie: a.cookie });
    expect(m.body.appointments?.map((x) => x.id)).toEqual([a.body.id]);
    expect(m.body.appointments?.[0].status).toBe("pending");
  });

  it("abrir o link do pedido grava o cookie neste aparelho", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: NOW });
    const appt = await book("manicure");
    const r = await hit(apptStatus, "GET", { params: { id: appt.id } });
    expect((await hit(mine, "GET", { cookie: r.cookie })).body.appointments?.map((x) => x.id)).toEqual([appt.id]);
  });

  it("filtra em andamento: pendente, confirmado futuro e recusado futuro; passado sai", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: NOW });
    const a = await hit(createAppt, "POST", { body: order("15:00") });
    const b = await hit(createAppt, "POST", { body: order("10:00", "pedicure", "2026-11-03"), cookie: a.cookie });
    const c = await hit(createAppt, "POST", { body: order("14:00", "depilacao", "2026-11-04"), cookie: b.cookie });
    await repo.transition(c.body.id!, "reject");
    await repo.transition(b.body.id!, "confirm");
    expect((await hit(mine, "GET", { cookie: c.cookie })).body.appointments?.map((x) => x.id)).toEqual([
      b.body.id,
      c.body.id,
      a.body.id,
    ]);
    vi.setSystemTime(new Date("2026-11-04T18:00:00Z")); // quarta 15:00 SP
    expect((await hit(mine, "GET", { cookie: c.cookie })).body.appointments?.map((x) => x.id)).toEqual([a.body.id]);
  });

  it("cookie adulterado ou ausente: lista vazia", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: NOW });
    const a = await hit(createAppt, "POST", { body: order("11:00") });
    const tampered = a.cookie!.slice(0, -3) + "abc";
    expect((await hit(mine, "GET", { cookie: tampered })).body.appointments).toEqual([]);
    const none = await hit(mine, "GET");
    expect(none.body.appointments).toEqual([]);
    expect(none.cookie).toBeNull();
  });

  it("limite de 10: o mais antigo sai", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: NOW });
    let cookie: string | null = null;
    const ids: string[] = [];
    for (let i = 0; i < 11; i++) {
      const t = `${String(9 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`;
      const r = await hit(createAppt, "POST", { body: order(t), cookie });
      ids.push(r.body.id!);
      cookie = r.cookie;
    }
    const listed = (await hit(mine, "GET", { cookie })).body.appointments!.map((x) => x.id);
    expect(listed).toHaveLength(10);
    expect(listed).not.toContain(ids[0]);
    expect(listed).toContain(ids[10]);
  });
});

describe("WhatsApp da profissional (adapt-front-to-backend)", () => {
  it("a profissional salva o próprio número em E.164 e o master vê só para leitura", async () => {
    const r = await call(me, "PATCH", { as: "stefani", body: { whatsappPhone: "(21) 99999-0000" } });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ role: "professional", professionalId: "stefani", whatsappPhone: "+5521999990000" });
    expect((await call(me, "GET", { as: "stefani" })).body.whatsappPhone).toBe("+5521999990000");
    const list = await call(professionals, "GET", { as: "master" });
    const stefani = list.body.professionals.find((p: { id: string }) => p.id === "stefani");
    expect(stefani.whatsappPhone).toBe("+5521999990000");
  });

  it("null ou vazio remove o número", async () => {
    await call(me, "PATCH", { as: "lorrayne", body: { whatsappPhone: "21988887777" } });
    expect((await call(me, "PATCH", { as: "lorrayne", body: { whatsappPhone: null } })).body.whatsappPhone).toBeNull();
    await call(me, "PATCH", { as: "lorrayne", body: { whatsappPhone: "21988887777" } });
    expect((await call(me, "PATCH", { as: "lorrayne", body: { whatsappPhone: "  " } })).body.whatsappPhone).toBeNull();
  });

  it("número inválido: 400 em fields.whatsappPhone, sem mudar o número", async () => {
    await call(me, "PATCH", { as: "michele", body: { whatsappPhone: "21977776666" } });
    const r = await call(me, "PATCH", { as: "michele", body: { whatsappPhone: "9999-0000" } });
    expect(r.status).toBe(400);
    expect(r.body.code).toBe("VALIDATION_ERROR");
    expect(r.body.fields.whatsappPhone).toBe("Informe o WhatsApp com DDD, ex.: (21) 96811-7976");
    expect((await call(me, "GET", { as: "michele" })).body.whatsappPhone).toBe("+5521977776666");
  });

  it("master não altera: 403 FORBIDDEN", async () => {
    const r = await call(me, "PATCH", { as: "master", body: { whatsappPhone: "21999990000" } });
    expect(r.status).toBe(403);
    expect(r.body.code).toBe("FORBIDDEN");
  });

  it("o número não aparece no catálogo público", async () => {
    await call(me, "PATCH", { as: "stefani", body: { whatsappPhone: "21999990000" } });
    const res = await (publicServices.GET as () => Promise<Response>)();
    expect(JSON.stringify(await res.json())).not.toContain("99999");
  });
});
