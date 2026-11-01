"use client";

import { api } from "@/lib/api-client";
import { formatDateLong, formatDuration } from "@/lib/domain/format";
import type { PublicService } from "@/lib/domain/types";
import { useApi } from "@/lib/client/useApi";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { StepHeader } from "@/components/ui/StepHeader";
import { ServiceSummary } from "./ServiceSummary";

type Props = {
  service: PublicService;
  date: string;
  selected?: string;
  notice?: string;
  onSelect: (time: string) => void;
  onChangeDay: () => void;
};

export function StepTime({ service, date, selected, notice, onSelect, onChangeDay }: Props) {
  // A chave inclui o aviso: depois de um 409, a lista é recarregada.
  const { data, error, reload } = useApi(`slots:${service.id}:${date}:${notice ?? ""}`, () =>
    api.availability(service.id, date),
  );

  return (
    <>
      <StepHeader step={3} total={5} title="Escolha o horário" />
      <ServiceSummary service={service} />
      <p className="mb-4 text-lg">
        Dia: <span className="font-bold first-letter:uppercase">{formatDateLong(date)}</span>
      </p>
      {notice && (
        <p role="alert" className="mb-4 rounded-2xl bg-warn-bg px-4 py-3 font-bold text-warn">
          {notice}
        </p>
      )}
      {error ? (
        <div role="alert" className="rounded-3xl bg-danger-bg p-5 text-danger">
          <p className="font-bold">{error.message}</p>
          <Button variant="secondary" className="mt-4 w-full" onClick={reload}>
            Tentar de novo
          </Button>
        </div>
      ) : !data ? (
        <Spinner label="Buscando horários..." />
      ) : data.slots.length === 0 ? (
        <div className="rounded-3xl bg-blush p-5 text-center">
          <p className="font-bold">Sem horários livres neste dia.</p>
          <Button variant="secondary" className="mt-4 w-full" onClick={onChangeDay}>
            Escolher outro dia
          </Button>
        </div>
      ) : (
        <>
          <p className="mb-3 text-base">Horário de início. O atendimento dura {formatDuration(service.durationMin)}.</p>
          <ul className="grid grid-cols-3 gap-3">
            {data.slots.map((t) => {
              const sel = t === selected;
              return (
                <li key={t}>
                  <button
                    type="button"
                    aria-pressed={sel}
                    onClick={() => onSelect(t)}
                    className={`min-h-14 w-full rounded-2xl border-2 text-lg font-bold ${
                      sel ? "border-cocoa bg-cocoa text-white" : "border-blush-2 bg-white/80 text-coffee hover:border-cocoa"
                    }`}
                  >
                    {t}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
