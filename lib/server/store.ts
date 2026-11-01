import type { Appointment, Category, Professional, Service } from "@/lib/domain/types";
import { createEventBus, logSubscriber, type EventBus } from "./events";
import { seedCategories, seedProfessionals, seedServices } from "./seed";

export interface Store {
  professionals: Professional[];
  categories: Category[];
  services: Service[];
  appointments: Appointment[];
  events: EventBus;
  startedAt: string;
}

function createStore(): Store {
  const events = createEventBus();
  events.subscribe(logSubscriber);
  return {
    professionals: structuredClone(seedProfessionals),
    categories: structuredClone(seedCategories),
    services: structuredClone(seedServices),
    appointments: [],
    events,
    startedAt: new Date().toISOString(),
  };
}

// Singleton em globalThis: o hot reload do `next dev` reavalia módulos,
// e sem isso os dados seriam perdidos ou duplicados a cada edição.
const g = globalThis as typeof globalThis & { __beautyStore?: Store };

export function getStore(): Store {
  g.__beautyStore ??= createStore();
  return g.__beautyStore;
}

/** Só para testes. */
export function resetStore(): Store {
  g.__beautyStore = createStore();
  return g.__beautyStore;
}
