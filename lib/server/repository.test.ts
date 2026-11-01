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

  it("serviço inativo não aceita pedido", async () => {
    await repo.updateService("manicure", { active: false });
    const r = await repo.createAppointment({ serviceId: "manicure", date: FRI, time: "11:00", ...customer }, NOW);
    expect(r).toEqual({ ok: false, reason: "SERVICE_NOT_FOUND" });
  });
});
