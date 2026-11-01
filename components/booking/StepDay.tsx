"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { nowInSalon, WINDOW_DAYS } from "@/lib/domain/schedule";
import { formatDayMonth, formatWeekday } from "@/lib/domain/format";
import type { PublicService } from "@/lib/domain/types";
import { useApi } from "@/lib/client/useApi";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { StepHeader } from "@/components/ui/StepHeader";
import { ServiceSummary } from "./ServiceSummary";

const FIRST_BATCH = 12;

export function StepDay({
  service,
  selected,
  onSelect,
}: {
  service: PublicService;
  selected?: string;
  onSelect: (date: string) => void;
}) {
  const today = nowInSalon().date;
  const { data, error, reload } = useApi(`days:${service.id}:${today}`, () =>
    api.days(service.id, today, WINDOW_DAYS + 1),
  );
  const [showAll, setShowAll] = useState(false);

  // Domingo não aparece: só dias de atendimento.
  const days = (data?.days ?? []).filter((d) => d.open);
  const selectedIndex = days.findIndex((d) => d.date === selected);
  const visible = showAll || selectedIndex >= FIRST_BATCH ? days : days.slice(0, FIRST_BATCH);

  return (
    <>
      <StepHeader step={2} total={5} title="Escolha o dia" />
      <ServiceSummary service={service} />
      {error ? (
        <div role="alert" className="rounded-3xl bg-danger-bg p-5 text-danger">
          <p className="font-bold">{error.message}</p>
          <Button variant="secondary" className="mt-4 w-full" onClick={reload}>
            Tentar de novo
          </Button>
        </div>
      ) : !data ? (
        <Spinner label="Buscando dias livres..." />
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-3">
            {visible.map((d) => {
              const sel = d.date === selected;
              return (
                <li key={d.date}>
                  <button
                    type="button"
                    disabled={!d.hasSlots}
                    aria-pressed={sel}
                    onClick={() => onSelect(d.date)}
                    className={`flex min-h-20 w-full flex-col items-center justify-center rounded-3xl border-2 px-2 py-2 text-center ${
                      !d.hasSlots
                        ? "cursor-not-allowed border-blush-2 bg-blush text-coffee/80"
                        : sel
                          ? "border-cocoa bg-cocoa text-white"
                          : "border-blush-2 bg-white/80 text-coffee hover:border-cocoa"
                    }`}
                  >
                    <span className="font-bold first-letter:uppercase">{d.date === today ? "Hoje" : formatWeekday(d.date)}</span>
                    <span className="text-base">{formatDayMonth(d.date)}</span>
                    {!d.hasSlots && <span className="text-base font-bold">Sem horários</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          {!showAll && days.length > visible.length && (
            <Button variant="secondary" className="mt-4 w-full" onClick={() => setShowAll(true)}>
              Mostrar mais dias
            </Button>
          )}
        </>
      )}
    </>
  );
}
