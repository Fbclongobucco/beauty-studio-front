"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/lib/api-client";
import { formatDateLong, formatDuration, formatPrice, STATUS_LABEL, whatsappLink } from "@/lib/domain/format";
import type { AppointmentStatus as Status } from "@/lib/domain/types";
import { useApi } from "@/lib/client/useApi";
import { markShownThisVisit } from "@/lib/client/my-requests-visit";
import { SALON } from "@/lib/salon";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { WhatsAppIcon } from "@/components/ui/icons";

export const STATUS_STYLE: Record<Status, string> = {
  pending: "bg-warn-bg text-warn",
  confirmed: "bg-ok-bg text-ok",
  rejected: "bg-danger-bg text-danger",
  cancelled: "bg-danger-bg text-danger",
};

const STATUS_TEXT: Record<Status, string> = {
  pending: "O salão vai conferir a agenda e confirmar pelo WhatsApp.",
  confirmed: "Seu horário está garantido. Esperamos você!",
  rejected: "Não foi possível atender neste horário. Faça um novo pedido ou fale com o salão.",
  cancelled: "Este agendamento foi cancelado. Se precisar, faça um novo pedido ou fale com o salão.",
};

export function AppointmentStatus() {
  const { id } = useParams<{ id: string }>();
  const isNew = useSearchParams().get("novo") === "1";
  const { data, error, reload, loading } = useApi(`appt:${id}`, () => api.appointment(id));
  // Já viu um pedido nesta visita: a página inicial não a manda de volta para cá.
  useEffect(() => markShownThisVisit(), []);


  if (error?.code === "NOT_FOUND") {
    return (
      <div className="text-center">
        <h1 className="font-brand text-2xl font-semibold lg:text-4xl">Agendamento não encontrado</h1>
        <p className="mt-3">Confira se o link está completo.</p>
        <LinkButton href="/?inicio=1" className="mt-6 w-full">
          Ir para o início
        </LinkButton>
      </div>
    );
  }
  if (error) {
    return (
      <div role="alert" className="rounded-3xl bg-danger-bg p-5 text-danger">
        <p className="font-bold">{error.message}</p>
        <Button variant="secondary" className="mt-4 w-full" onClick={reload}>
          Tentar de novo
        </Button>
      </div>
    );
  }
  if (!data) return <Spinner />;

  return (
    <div>
      {isNew && (
        <p className="mb-4 rounded-2xl bg-ok-bg px-4 py-3 text-lg font-bold text-ok" role="status">
          Pedido enviado, {data.customerFirstName}!
        </p>
      )}
      <h1 className="font-brand text-2xl font-semibold lg:text-4xl text-coffee">Seu agendamento</h1>
      <p className={`mt-4 inline-block rounded-full px-4 py-2 text-lg font-bold ${STATUS_STYLE[data.status]}`}>
        {STATUS_LABEL[data.status]}
      </p>
      <p className="mt-3">{STATUS_TEXT[data.status]}</p>

      <Card className="mt-5">
        <dl className="space-y-3">
          <div>
            <dt className="text-base text-cocoa">Serviço</dt>
            <dd className="font-bold">
              {data.serviceName} ({formatDuration(data.durationMin)})
            </dd>
          </div>
          <div>
            <dt className="text-base text-cocoa">Profissional</dt>
            <dd className="font-bold">{data.professionalName}</dd>
          </div>
          <div>
            <dt className="text-base text-cocoa">Dia e horário</dt>
            <dd className="font-bold first-letter:uppercase">
              {formatDateLong(data.date)}, às {data.time}
            </dd>
          </div>
          <div>
            <dt className="text-base text-cocoa">Valor</dt>
            <dd className="font-bold">{formatPrice(data.priceCents)}</dd>
          </div>
        </dl>
      </Card>

      <div className="mt-6 flex flex-col gap-3">
        <Button variant="secondary" onClick={reload} disabled={loading}>
          Atualizar status
        </Button>
        <a
          href={whatsappLink(SALON.whatsappE164, `Olá! Fiz um pedido de agendamento pelo site: ${data.serviceName}, ${data.time}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-coffee px-6 text-lg font-bold text-white hover:bg-ink"
        >
          <WhatsAppIcon className="h-6 w-6" />
          Falar com o salão
        </a>
        <LinkButton href="/?inicio=1" variant="ghost">
          Voltar para o início
        </LinkButton>

      </div>
    </div>
  );
}
