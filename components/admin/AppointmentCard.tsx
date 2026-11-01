"use client";

import { formatDateLong, formatDuration, formatPhone, formatPrice, STATUS_LABEL, whatsappLink } from "@/lib/domain/format";
import type { AdminAppointment, StatusAction } from "@/lib/domain/types";
import { Button } from "@/components/ui/Button";

const STATUS_STYLE = {
  pending: "bg-warn-bg text-warn",
  confirmed: "bg-ok-bg text-ok",
  rejected: "bg-danger-bg text-danger",
  cancelled: "bg-danger-bg text-danger",
} as const;

type Props = {
  a: AdminAppointment;
  isNew?: boolean;
  showDate?: boolean;
  onAction: (a: AdminAppointment, action: StatusAction) => void;
};

export function AppointmentCard({ a, isNew, showDate = true, onAction }: Props) {
  const blocked = a.conflict === "confirmed";
  return (
    <article className={`rounded-3xl border-2 bg-white/90 p-5 ${isNew ? "border-cocoa" : "border-blush-2"}`}>
      <div className="flex flex-wrap items-center gap-2">
        {isNew && <span className="rounded-full bg-cocoa px-3 py-0.5 text-base font-bold text-white">Novo</span>}
        <span className={`rounded-full px-3 py-0.5 text-base font-bold ${STATUS_STYLE[a.status]}`}>
          {STATUS_LABEL[a.status]}
        </span>
        {a.conflict && (
          <span className="rounded-full bg-danger-bg px-3 py-0.5 text-base font-bold text-danger">Conflito de horário</span>
        )}
      </div>
      <p className="mt-3 text-xl font-bold text-coffee">
        {a.time}
        {showDate && <span className="font-normal first-letter:uppercase"> · {formatDateLong(a.date)}</span>}
      </p>
      <p className="mt-1">
        <span className="font-bold">{a.serviceName}</span> · {formatDuration(a.durationMin)} ·{" "}
        <span className="whitespace-nowrap">{formatPrice(a.priceCents)}</span>
      </p>
      <p className="text-base text-cocoa">com {a.professionalName}</p>
      <div className="mt-3 rounded-2xl bg-blush px-4 py-3">
        <p className="font-bold">{a.customerName}</p>
        <a
          href={whatsappLink(a.customerPhoneE164)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center font-bold text-coffee underline underline-offset-4"
        >
          {formatPhone(a.customerPhoneE164)} (WhatsApp)
        </a>
        {a.notes && <p className="text-base">Obs.: {a.notes}</p>}
      </div>
      {a.reason && <p className="mt-2 text-base">Motivo: {a.reason}</p>}
      {blocked && (
        <p className="mt-3 text-base font-bold text-danger">
          Já existe um agendamento confirmado nesse horário para {a.professionalName.split(" ")[0]}.
        </p>
      )}
      {a.conflict === "pending" && (
        <p className="mt-3 text-base">Há outro pedido no mesmo horário. Ao confirmar este, o outro fica bloqueado.</p>
      )}
      {a.status === "pending" && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button onClick={() => onAction(a, "confirm")} disabled={blocked}>
            Confirmar
          </Button>
          <Button variant="secondary" onClick={() => onAction(a, "reject")}>
            Recusar
          </Button>
        </div>
      )}
      {a.status === "confirmed" && (
        <div className="mt-4">
          <Button variant="secondary" className="w-full" onClick={() => onAction(a, "cancel")}>
            Cancelar agendamento
          </Button>
        </div>
      )}
    </article>
  );
}
