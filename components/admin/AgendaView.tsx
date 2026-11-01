"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { api } from "@/lib/api-client";
import { addDays, isDateString, nowInSalon, weekStart } from "@/lib/domain/schedule";
import { formatDateLong, formatDayMonth } from "@/lib/domain/format";
import type { AdminAppointment } from "@/lib/domain/types";
import { useApi } from "@/lib/client/useApi";
import { Spinner } from "@/components/ui/Spinner";
import { useAdmin } from "./AdminShell";
import { AppointmentCard } from "./AppointmentCard";
import { useAppointmentAction } from "./useAppointmentAction";
import { WeekGrid } from "./WeekGrid";

const navBtn =
  "inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-cocoa bg-white/70 text-2xl font-bold text-coffee hover:bg-blush";
const pill = (on: boolean) =>
  `min-h-12 rounded-full border-2 px-4 font-bold ${on ? "border-cocoa bg-cocoa text-white" : "border-blush-2 bg-white text-coffee"}`;

export function AgendaView() {
  const router = useRouter();
  const sp = useSearchParams();
  const today = nowInSalon().date;
  const date = isDateString(sp.get("dia")) ? (sp.get("dia") as string) : today;
  const week = sp.get("visao") === "semana";
  const { tick, refresh, session } = useAdmin();
  const isMaster = session.role === "master";
  // Profissional vê sempre a própria agenda; o filtro só existe para o master.
  const prof = isMaster ? (sp.get("profissional") ?? "") : "";
  const showClosed = sp.get("todos") === "1";
  const dateId = useId();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const ws = weekStart(date);
  const days = Array.from({ length: 6 }, (_, i) => addDays(ws, i));
  const thisWeek = weekStart(today);

  const catalog = useApi(isMaster ? "catalog" : null, api.admin.catalog);
  const range = week ? { from: days[0], to: days[5] } : { date };
  const { data, stale, error, reload } = useApi(`agenda:${week ? `w${ws}` : date}:${prof}:${tick}`, () =>
    api.admin.appointments({ ...range, professionalId: prof || undefined }),
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
  const selected = list?.find((a) => a.id === selectedId) ?? null;

  const card = (a: AdminAppointment, showDate = false) => (
    <AppointmentCard a={a} showDate={showDate} showProfessional={isMaster} onAction={ask} />
  );

  return (
    <div>
      <h1 className="font-brand text-2xl font-semibold">Agenda</h1>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Visão da agenda">
        <button type="button" aria-pressed={!week} onClick={() => set({ visao: undefined })} className={pill(!week)}>
          Dia
        </button>
        <button type="button" aria-pressed={week} onClick={() => set({ visao: "semana" })} className={pill(week)}>
          Semana
        </button>
      </div>

      {week ? (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" className={navBtn} onClick={() => set({ dia: addDays(ws, -7) })} aria-label="Semana anterior">
              ‹
            </button>
            <p className="min-w-0 flex-1 text-center text-lg font-bold sm:flex-none sm:px-2">
              {formatDayMonth(days[0])} a {formatDayMonth(days[5])}
              {ws === thisWeek && " (esta semana)"}
            </p>
            <button type="button" className={navBtn} onClick={() => set({ dia: addDays(ws, 7) })} aria-label="Próxima semana">
              ›
            </button>
          </div>
          {ws !== thisWeek && (
            <button type="button" className="min-h-12 font-bold underline underline-offset-4" onClick={() => set({ dia: undefined })}>
              Ir para esta semana
            </button>
          )}
        </>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" className={navBtn} onClick={() => set({ dia: addDays(date, -1) })} aria-label="Dia anterior">
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
              className="order-last min-h-14 min-w-[8rem] flex-1 rounded-2xl border-2 border-blush-2 bg-white px-3 text-lg sm:order-none lg:max-w-xs"
            />
            <button type="button" className={navBtn} onClick={() => set({ dia: addDays(date, 1) })} aria-label="Próximo dia">
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
        </>
      )}

      {isMaster && (
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por profissional">
          {[{ id: "", name: "Todas" }, ...(catalog.data?.professionals ?? [])].map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={prof === p.id}
              onClick={() => set({ profissional: p.id || undefined })}
              className={pill(prof === p.id)}
            >
              {p.id ? p.name.split(" ")[0] : p.name}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5">{dialog}</div>
      {error && !list ? (
        <p role="alert" className="rounded-3xl bg-danger-bg p-5 font-bold text-danger">
          {error.message}
        </p>
      ) : !list ? (
        <Spinner />
      ) : week ? (
        <>
          {/* Computador: grade com detalhe ao lado. */}
          <div className="hidden gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem]">
            <WeekGrid
              days={days}
              today={today}
              list={list}
              selectedId={selectedId}
              showProfessional={isMaster}
              onSelect={(a) => setSelectedId(a.id)}
            />
            <aside aria-label="Agendamento selecionado" className="sticky top-[calc(var(--admin-top)+1.25rem)] self-start">
              {selected ? (
                <div>
                  {card(selected, true)}
                  <button
                    type="button"
                    className="mt-2 min-h-12 font-bold underline underline-offset-4"
                    onClick={() => setSelectedId(null)}
                  >
                    Fechar detalhes
                  </button>
                </div>
              ) : (
                <p className="rounded-3xl bg-blush p-6 text-center text-lg">
                  {list.length === 0 ? "Nenhum agendamento nesta semana." : "Selecione um agendamento na grade para ver os dados e as ações."}
                </p>
              )}
            </aside>
          </div>
          {/* Celular e tablet: lista agrupada por dia. */}
          <div className="space-y-6 lg:hidden">
            {list.length === 0 ? (
              <p className="rounded-3xl bg-blush p-6 text-center text-lg">Nenhum agendamento nesta semana.</p>
            ) : (
              days.map((d) => {
                const items = list.filter((a) => a.date === d);
                if (items.length === 0) return null;
                return (
                  <section key={d} aria-label={formatDateLong(d)}>
                    <h2 className="mb-3 text-lg font-bold first-letter:uppercase">
                      {formatDateLong(d)}
                      {d === today && " (hoje)"}
                    </h2>
                    <ul className="space-y-4">
                      {items.map((a) => (
                        <li key={a.id}>{card(a)}</li>
                      ))}
                    </ul>
                  </section>
                );
              })
            )}
          </div>
        </>
      ) : list.length === 0 ? (
        <p className="rounded-3xl bg-blush p-6 text-center text-lg">Nenhum agendamento neste dia.</p>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2 min-[1440px]:grid-cols-3">
          {list.map((a) => (
            <li key={a.id}>{card(a)}</li>
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
