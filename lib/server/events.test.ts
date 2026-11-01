import { describe, expect, it, vi } from "vitest";
import { createEventBus, type DomainEvent } from "./events";

const ev = { type: "appointment.created", at: "", appointment: {}, service: null, customerPhoneE164: "+55" } as unknown as DomainEvent;

describe("barramento de eventos", () => {
  it("assinante com erro não quebra o emit nem os demais", async () => {
    const onError = vi.fn();
    const bus = createEventBus(onError);
    const good = vi.fn();
    bus.subscribe(() => {
      throw new Error("falhou");
    });
    bus.subscribe(async () => {
      throw new Error("falhou async");
    });
    bus.subscribe(good);
    expect(() => bus.emit(ev)).not.toThrow();
    await new Promise((r) => setTimeout(r, 0));
    expect(good).toHaveBeenCalledWith(ev);
    expect(onError).toHaveBeenCalledTimes(2);
  });
});
