import type { Appointment, PublicAppointment } from "@/lib/domain/types";

export function toPublicAppointment(a: Appointment): PublicAppointment {
  return {
    id: a.id,
    status: a.status,
    serviceName: a.serviceName,
    professionalName: a.professionalName,
    durationMin: a.durationMin,
    priceCents: a.priceCents,
    date: a.date,
    time: a.time,
    startISO: a.startISO,
    endISO: a.endISO,
    customerFirstName: a.customerName.split(" ")[0],
  };
}
