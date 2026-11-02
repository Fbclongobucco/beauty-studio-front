import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryRepository } from "./repository";
import { resetStore, type Store } from "./store";
import { seedServices } from "./seed";

const NOW = new Date("2026-11-01T11:00:00Z"); // domingo 08:00 SP
const FRI = "2026-11-06";
const customer = { customerName: "Maria", customerPhoneE164: "+5521968117976", notes: null };

let store: Store;
let repo: ReturnType<typeof createMemoryRepository>;

beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => {});
  store = resetStore();
  repo = createMemoryRepository(() => store);
});

describe("seed", () => {
  it("tem 21 serviços, 3 categorias e 3 profissionais", async () => {
    expect(seedServices).toHaveLength(21);
    expect(await repo.listCategories()).toHaveLength(3);
    expect(await repo.listProfessionals()).toHaveLength(3);
    const box = await repo.getService("box-braids");
    expect(box).toMatchObject({ priceCents: 19000, durationMin: 360, durationEstimated: true, professionalId: "lorrayne" });
    expect(await repo.getService("manicure")).toMatchObject({ priceCents: 2000, durationEstimated: false });
  });
});

describe("agendamentos", () => {
  it("dois pedidos no mesmo horário; confirmar um bloqueia o outro", async () => {
    const a = await repo.createAppointment({ serviceId: "manicure", date: FRI, time: "11:00", ...customer }, NOW);
    const b = await repo.createAppointment({ serviceId: "manicure", date: FRI, time: "11:00", ...customer }, NOW);
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;

    let list = await repo.listAppointments({ status: "pending" });
    expect(list.map((x) => x.conflict)).toEqual(["pending", "pending"]);

    expect((await repo.transition(a.appointment.id, "confirm")).ok).toBe(true);
    list = await repo.listAppointments({ status: "pending" });
    expect(list[0].conflict).toBe("confirmed");

    const again = await repo.transition(b.appointment.id, "confirm");
    expect(again).toEqual({ ok: false, reason: "SLOT_TAKEN" });

    // Novo pedido no horário confirmado é recusado.
    const c = await repo.createAppointment({ serviceId: "manicure", date: FRI, time: "11:00", ...customer }, NOW);
    expect(c).toEqual({ ok: false, reason: "SLOT_UNAVAILABLE" });
    // Outra profissional segue livre.
    const d = await repo.createAppointment({ serviceId: "depilacao", date: FRI, time: "11:00", ...customer }, NOW);
    expect(d.ok).toBe(true);
  });

  it("cancelar libera o horário e transição inválida é recusada", async () => {
    const a = await repo.createAppointment({ serviceId: "manicure", date: FRI, time: "11:00", ...customer }, NOW);
    if (!a.ok) throw new Error();
    await repo.transition(a.appointment.id, "confirm");
    expect((await repo.transition(a.appointment.id, "cancel", "Cliente desmarcou")).ok).toBe(true);
    expect(await repo.transition(a.appointment.id, "confirm")).toEqual({ ok: false, reason: "INVALID_TRANSITION" });
    const again = await repo.createAppointment({ serviceId: "manicure", date: FRI, time: "11:00", ...customer }, NOW);
    expect(again.ok).toBe(true);
  });

  it("editar preço e duração não altera agendamento existente; duração deixa de ser estimada", async () => {
    const a = await repo.createAppointment({ serviceId: "box-braids", date: FRI, time: "09:00", ...customer }, NOW);
    if (!a.ok) throw new Error();
    await repo.updateService("box-braids", { priceCents: 25000, durationMin: 300 });
    const svc = await repo.getService("box-braids");
    expect(svc).toMatchObject({ priceCents: 25000, durationMin: 300, durationEstimated: false });
    const stored = await repo.getAppointment(a.appointment.id);
    expect(stored).toMatchObject({ priceCents: 19000, durationMin: 360, endISO: "2026-11-06T15:00:00-03:00" });
  });

  it("contagem de pendentes e marcação de vistos", async () => {
    await repo.createAppointment({ serviceId: "manicure", date: FRI, time: "11:00", ...customer }, NOW);
    expect(await repo.pendingCount()).toEqual({ pending: 1, unseen: 1 });
    expect(await repo.markSeen()).toBe(1);
    expect(await repo.pendingCount()).toEqual({ pending: 1, unseen: 0 });
  });

  it("contagem e vistos por profissional", async () => {
    await repo.createAppointment({ serviceId: "manicure", date: FRI, time: "11:00", ...customer }, NOW);
    await repo.createAppointment({ serviceId: "depilacao", date: FRI, time: "11:00", ...customer }, NOW);
    expect(await repo.pendingCount("stefani")).toEqual({ pending: 1, unseen: 1 });
    expect(await repo.pendingCount()).toEqual({ pending: 2, unseen: 2 });
    // Stéfani não marca como visto o pedido da Michele, mesmo informando todos os ids.
    const ids = (await repo.listAppointments()).map((a) => a.id);
    expect(await repo.markSeen(ids, "stefani")).toBe(1);
    expect(await repo.pendingCount("michele")).toEqual({ pending: 1, unseen: 1 });
  });

  it("filtra por intervalo de datas inclusivo", async () => {
    await repo.createAppointment({ serviceId: "manicure", date: "2026-11-02", time: "11:00", ...customer }, NOW);
    await repo.createAppointment({ serviceId: "manicure", date: FRI, time: "11:00", ...customer }, NOW);
    await repo.createAppointment({ serviceId: "manicure", date: "2026-11-09", time: "11:00", ...customer }, NOW);
    const week = await repo.listAppointments({ from: "2026-11-02", to: "2026-11-07" });
    expect(week.map((a) => a.date)).toEqual(["2026-11-02", FRI]);
  });

  it("serviço inativo não aceita pedido", async () => {
    await repo.updateService("manicure", { active: false });
    const r = await repo.createAppointment({ serviceId: "manicure", date: FRI, time: "11:00", ...customer }, NOW);
    expect(r).toEqual({ ok: false, reason: "SERVICE_NOT_FOUND" });
  });
});

describe("foto do serviço", () => {
  const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
  const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 9]);

  it("seed sem foto", async () => {
    expect((await repo.listServices()).every((s) => s.photoUrl === null)).toBe(true);
  });

  it("envio grava, troca muda a URL e descarta a anterior", async () => {
    const a = await repo.setServicePhoto("manicure", JPEG, "image/jpeg");
    expect(a?.photoUrl).toMatch(/^\/api\/service-photos\/[0-9a-f-]{36}$/);
    const idA = a!.photoUrl!.split("/").pop()!;
    expect(await repo.getPhoto(idA)).toEqual({ bytes: JPEG, contentType: "image/jpeg" });
    expect((await repo.getService("manicure"))?.photoUrl).toBe(a!.photoUrl);

    const b = await repo.setServicePhoto("manicure", PNG, "image/png");
    expect(b!.photoUrl).not.toBe(a!.photoUrl);
    expect(await repo.getPhoto(idA)).toBeNull();
    expect(store.photos.size).toBe(1);
  });

  it("remoção zera a URL e apaga a imagem; serviço inexistente retorna null", async () => {
    const a = await repo.setServicePhoto("manicure", JPEG, "image/jpeg");
    const removed = await repo.removeServicePhoto("manicure");
    expect(removed?.photoUrl).toBeNull();
    expect(store.photos.size).toBe(0);
    expect(await repo.getPhoto(a!.photoUrl!.split("/").pop()!)).toBeNull();
    expect(await repo.removeServicePhoto("manicure")).toMatchObject({ photoUrl: null });
    expect(await repo.setServicePhoto("nao-existe", JPEG, "image/jpeg")).toBeNull();
  });

  it("reinício (resetStore) volta tudo para sem foto", async () => {
    await repo.setServicePhoto("manicure", JPEG, "image/jpeg");
    store = resetStore();
    expect((await repo.getService("manicure"))?.photoUrl).toBeNull();
    expect(store.photos.size).toBe(0);
  });
});
