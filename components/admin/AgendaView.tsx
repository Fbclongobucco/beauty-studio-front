"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useId } from "react";
import { api } from "@/lib/api-client";
import { addDays, isDateString, nowInSalon } from "@/lib/domain/schedule";
import { formatDateLong } from "@/lib/domain/format";
import { useApi } from "@/lib/client/useApi";
import { Spinner } from "@/components/ui/Spinner";
import { useAdmin } from "./AdminShell";
import { AppointmentCard } from "./AppointmentCard";
import { useAppointmentAction } from "./useAppointmentAction";

export function AgendaView() {
  const router = useRouter();
  const sp = useSearchParams();
  const today = nowInSalon().date;
  const date = isDateString(sp.get("dia")) ? (sp.get("dia") as string) : today;
  const prof = sp.get("profissional") ?? "";
  const showClosed = sp.get("todos") === "1";
  const { tick, refresh } = useAdmin();
  const dateId = useId();

  const catalog = useApi("catalog", api.admin.catalog);
  const { data, stale, error, reload } = useApi(`agenda:${date}:${prof}:${tick}`, () =>
    api.admin.appointments({ date, professionalId: prof || undefined }),
  );
  const { ask, dialog } = useAppointmentAction(() => {
    reload();
    refresh();
  });

  const set = (next: Record<string, string | undefined>) => {
    const q = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) q.set(k, v);
      else q.delete(k);
    }
    router.replace(`/admin/agenda?${q.toString()}`, { scroll: false });
  };

  const all = (data ?? stale)?.appointments;
  const list = all?.filter((a) => showClosed || a.status === "pending" || a.status === "confirmed");
  const hidden = (all?.length ?? 0) - (list?.length ?? 0);

  return (
    <div>
      <h1 className="font-brand text-2xl font-semibold">Agenda</h1>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-cocoa bg-white/70 text-2xl font-bold text-coffee hover:bg-blush" onClick={() => set({ dia: addDays(date, -1) })} aria-label="Dia anterior">
          ‹
        </button>
        <label htmlFor={dateId} className="sr-only">
          Dia
        </label>
        <input
          id={dateId}
          type="date"
          value={date}
          onChange={(e) => isDateString(e.target.value) && set({ dia: e.target.value })}
          className="order-last min-h-14 min-w-[8rem] flex-1 rounded-2xl sm:order-none border-2 border-blush-2 bg-white px-3 text-lg"
        />
        <button type="button" className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-cocoa bg-white/70 text-2xl font-bold text-coffee hover:bg-blush" onClick={() => set({ dia: addDays(date, 1) })} aria-label="Próximo dia">
          ›
        </button>
      </div>
      <p className="mt-2 text-lg font-bold first-letter:uppercase">
        {formatDateLong(date)}
        {date === today && " (hoje)"}
      </p>
      {date !== today && (
        <button type="button" className="min-h-12 font-bold underline underline-offset-4" onClick={() => set({ dia: undefined })}>
          Ir para hoje
        </button>
      )}

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por profissional">
        {[{ id: "", name: "Todas" }, ...(catalog.data?.professionals ?? [])].map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={prof === p.id}
            onClick={() => set({ profissional: p.id || undefined })}
            className={`min-h-12 rounded-full border-2 px-4 font-bold ${
              prof === p.id ? "border-cocoa bg-cocoa text-white" : "border-blush-2 bg-white text-coffee"
            }`}
          >
            {p.id ? p.name.split(" ")[0] : p.name}
          </button>
        ))}
      </div>

      <div className="mt-5">{dialog}</div>
      {error && !list ? (
        <p role="alert" className="rounded-3xl bg-danger-bg p-5 font-bold text-danger">
          {error.message}
        </p>
      ) : !list ? (
        <Spinner />
      ) : list.length === 0 ? (
        <p className="rounded-3xl bg-blush p-6 text-center text-lg">Nenhum agendamento neste dia.</p>
      ) : (
        <ul className="space-y-4">
          {list.map((a) => (
            <li key={a.id}>
              <AppointmentCard a={a} showDate={false} onAction={ask} />
            </li>
          ))}
        </ul>
      )}
      {(hidden > 0 || showClosed) && (
        <button
          type="button"
          className="mt-4 min-h-12 font-bold underline underline-offset-4"
          onClick={() => set({ todos: showClosed ? undefined : "1" })}
        >
          {showClosed ? "Ocultar recusados e cancelados" : `Mostrar recusados e cancelados (${hidden})`}
        </button>
      )}
    </div>
  );
}
