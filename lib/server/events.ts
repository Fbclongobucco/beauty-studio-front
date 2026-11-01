import type { Appointment, Service } from "@/lib/domain/types";

export type DomainEventType =
  | "appointment.created"
  | "appointment.confirmed"
  | "appointment.rejected"
  | "appointment.cancelled";

export interface DomainEvent {
  type: DomainEventType;
  at: string;
  appointment: Appointment;
  service: Pick<Service, "id" | "name" | "durationMin"> | null;
  customerPhoneE164: string;
}

export type Subscriber = (event: DomainEvent) => void | Promise<void>;

export interface EventBus {
  subscribe(fn: Subscriber): () => void;
  emit(event: DomainEvent): void;
}

/**
 * Barramento simples em memória. Cada assinante roda isolado (microtask + try/catch),
 * então uma falha nunca impede a operação que gerou o evento.
 * Ponto de integração futuro: mensageria e lembretes por WhatsApp.
 */
export function createEventBus(onError: (e: unknown) => void = (e) => console.error("[event] assinante falhou", e)): EventBus {
  const subs = new Set<Subscriber>();
  return {
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    emit(event) {
      for (const fn of subs) {
        queueMicrotask(() => {
          try {
            const r = fn(event);
            if (r && typeof (r as Promise<void>).catch === "function") (r as Promise<void>).catch(onError);
          } catch (e) {
            onError(e);
          }
        });
      }
    },
  };
}

export const logSubscriber: Subscriber = (e) => {
  console.info("[event]", e.type, {
    id: e.appointment.id,
    date: e.appointment.date,
    time: e.appointment.time,
    service: e.appointment.serviceName,
    phone: e.customerPhoneE164,
    status: e.appointment.status,
  });
};
