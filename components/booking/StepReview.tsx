"use client";

import { useState } from "react";
import { api, ApiRequestError } from "@/lib/api-client";
import { formatDateLong, formatDuration, formatPrice } from "@/lib/domain/format";
import type { PublicService } from "@/lib/domain/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StepHeader } from "@/components/ui/StepHeader";
import type { CustomerData } from "./StepCustomer";

type Props = {
  service: PublicService;
  date: string;
  time: string;
  customer: CustomerData;
  onEdit: (step: number) => void;
  onTaken: () => void;
  onDone: (id: string) => void;
};

export function StepReview({ service, date, time, customer, onEdit, onTaken, onDone }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const a = await api.createAppointment({
        serviceId: service.id,
        date,
        time,
        customerName: customer.name,
        customerPhone: customer.phone,
        notes: customer.notes || undefined,
      });
      onDone(a.id);
    } catch (e) {
      setBusy(false);
      if (e instanceof ApiRequestError && e.code === "SLOT_UNAVAILABLE") return onTaken();
      setError(e instanceof Error ? e.message : "Algo deu errado. Tente de novo.");
    }
  }

  return (
    <>
      <StepHeader step={5} total={5} title="Confira e envie" />
      <Card>
        <dl>
          <Row onEdit={onEdit} label="Serviço" value={`${service.name} (${formatDuration(service.durationMin)})`} step={1} />
          <Row onEdit={onEdit} label="Valor" value={formatPrice(service.priceCents)} step={1} />
          <Row onEdit={onEdit} label="Profissional" value={service.professional.name} step={1} />
          <Row onEdit={onEdit} label="Dia" value={formatDateLong(date)} step={2} />
          <Row onEdit={onEdit} label="Horário" value={time} step={3} />
          <Row onEdit={onEdit} label="Nome" value={customer.name} step={4} />
          <Row onEdit={onEdit} label="WhatsApp" value={customer.phone} step={4} />
          {customer.notes && <Row onEdit={onEdit} label="Observação" value={customer.notes} step={4} />}
        </dl>
      </Card>
      <p className="mt-5">
        O pedido fica <strong>aguardando confirmação</strong> do salão. As atualizações do pedido (confirmação, recusa
        ou cancelamento) chegam por mensagem no WhatsApp <strong className="whitespace-nowrap">{customer.phone}</strong>.
      </p>
      {error && (
        <p role="alert" className="mt-4 rounded-2xl bg-danger-bg px-4 py-3 font-bold text-danger">
          {error}
        </p>
      )}
      <Button className="mt-6 w-full text-xl" disabled={busy} onClick={send}>
        {busy ? "Enviando..." : "Enviar pedido"}
      </Button>
    </>
  );
}

function Row({ label, value, step, onEdit }: { label: string; value: string; step: number; onEdit: (step: number) => void }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-blush-2 py-3 last:border-0">
      <div>
        <dt className="text-base text-cocoa">{label}</dt>
        <dd className="font-bold first-letter:uppercase">{value}</dd>
      </div>
      <button
        type="button"
        onClick={() => onEdit(step)}
        className="min-h-12 shrink-0 rounded-2xl px-3 font-bold text-coffee underline underline-offset-4"
        aria-label={`Alterar ${label.toLowerCase()}`}
      >
        Alterar
      </button>
    </div>
  );
}
