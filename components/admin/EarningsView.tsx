"use client";

import { useId, useState } from "react";
import { api } from "@/lib/api-client";
import { validateEarningsPeriod } from "@/lib/domain/earnings";
import { formatDateShort, formatPrice, formatWeekday } from "@/lib/domain/format";
import { addDays, isDateString, nowInSalon, weekStart } from "@/lib/domain/schedule";
import type { EarningsBucket } from "@/lib/domain/types";
import { useApi } from "@/lib/client/useApi";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useAdmin } from "./AdminShell";
import { EarningsChart, EXPECTED_COLOR, REALIZED_COLOR } from "./EarningsChart";
import { inputClass } from "./fields";

type Preset = "semana" | "mes" | "mes-passado" | "periodo";

const PRESETS: { id: Preset; label: string }[] = [
  { id: "semana", label: "Esta semana" },
  { id: "mes", label: "Este mês" },
  { id: "mes-passado", label: "Mês passado" },
  { id: "periodo", label: "Período" },
];

const pill = (on: boolean) =>
  `min-h-12 rounded-full border-2 px-4 font-bold lg:min-h-10 lg:text-base ${on ? "border-cocoa bg-cocoa text-white" : "border-blush-2 bg-white text-coffee"}`;

function monthRange(date: string): { from: string; to: string } {
  const from = `${date.slice(0, 8)}01`;
  const next = addDays(from, 32);
  return { from, to: addDays(`${next.slice(0, 8)}01`, -1) };
}

function presetRange(p: Exclude<Preset, "periodo">, today: string) {
  if (p === "semana") {
    const ws = weekStart(today);
    return { from: ws, to: addDays(ws, 5) };
  }
  if (p === "mes") return monthRange(today);
  return monthRange(addDays(monthRange(today).from, -1));
}

const count = (n: number) => (n === 1 ? "1 atendimento" : `${n} atendimentos`);

export function EarningsView() {
  const { session } = useAdmin();
  const isMaster = session.role === "master";
  const today = nowInSalon().date;
  const [preset, setPreset] = useState<Preset>("mes");
  const [custom, setCustom] = useState(() => monthRange(today));
  const [draft, setDraft] = useState(custom);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [prof, setProf] = useState("");
  const ids = { from: useId(), to: useId() };

  const range = preset === "periodo" ? custom : presetRange(preset, today);
  const catalog = useApi(isMaster ? "catalog" : null, api.admin.catalog);
  const { data, stale, error } = useApi(`earnings:${range.from}:${range.to}:${prof}`, () =>
    api.admin.earnings({ ...range, professionalId: prof || undefined }),
  );
  const e = data ?? stale;

  function applyCustom() {
    const fields = validateEarningsPeriod(draft.from, draft.to, isDateString);
    if (fields) return setDraftError(fields.to ?? fields.from ?? "Período inválido.");
    setDraftError(null);
    setCustom(draft);
  }

  return (
    <div>
      <h1 className="font-brand text-2xl font-semibold lg:text-4xl">{isMaster ? "Ganhos do salão" : "Meus ganhos"}</h1>
      <p className="mt-1 text-base">
        Soma dos agendamentos <strong>confirmados</strong>, pelo preço do serviço na hora do pedido. Não inclui adicionais
        nem descontos.
      </p>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Período">
        {PRESETS.map((p) => (
          <button key={p.id} type="button" aria-pressed={preset === p.id} onClick={() => setPreset(p.id)} className={pill(preset === p.id)}>
            {p.label}
          </button>
        ))}
      </div>

      {preset === "periodo" && (
        <div className="mt-4 rounded-3xl bg-blush p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:max-w-xl">
            <div>
              <label htmlFor={ids.from} className="block text-base font-bold">
                De
              </label>
              <input
                id={ids.from}
                type="date"
                value={draft.from}
                onChange={(ev) => setDraft((d) => ({ ...d, from: ev.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor={ids.to} className="block text-base font-bold">
                Até
              </label>
              <input
                id={ids.to}
                type="date"
                value={draft.to}
                aria-invalid={!!draftError || undefined}
                aria-describedby={draftError ? `${ids.to}-err` : undefined}
                onChange={(ev) => setDraft((d) => ({ ...d, to: ev.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
          {draftError && (
            <p id={`${ids.to}-err`} role="alert" className="mt-2 font-bold text-danger">
              {draftError}
            </p>
          )}
          <Button variant="secondary" className="mt-3 w-full sm:w-auto" onClick={applyCustom}>
            Ver período
          </Button>
        </div>
      )}

      {isMaster && (
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por profissional">
          {[{ id: "", name: "Todas" }, ...(catalog.data?.professionals ?? [])].map((p) => (
            <button key={p.id} type="button" aria-pressed={prof === p.id} onClick={() => setProf(p.id)} className={pill(prof === p.id)}>
              {p.id ? p.name.split(" ")[0] : p.name}
            </button>
          ))}
        </div>
      )}

      <p className="mt-4 text-lg font-bold">
        {formatDateShort(range.from)} a {formatDateShort(range.to)}
        {range.from.slice(0, 4) !== today.slice(0, 4) && ` de ${range.from.slice(0, 4)}`}
      </p>

      {error && !e ? (
        <p role="alert" className="mt-4 rounded-3xl bg-danger-bg p-5 font-bold text-danger">
          {error.message}
        </p>
      ) : !e ? (
        <Spinner />
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Stat label="Total" bucket={e.total} hero />
            <Stat label="Realizado" bucket={e.realized} swatch={REALIZED_COLOR} hint="Atendimentos já terminados" />
            <Stat label="Previsto" bucket={e.expected} swatch={EXPECTED_COLOR} hint="Ainda na agenda" />
          </div>
          {e.unpriced > 0 && (
            <p className="mt-3 rounded-2xl bg-warn-bg px-4 py-3 font-bold text-warn">
              {e.unpriced === 1
                ? "1 atendimento com valor a consultar, fora do total"
                : `${e.unpriced} atendimentos com valor a consultar, fora do total`}
            </p>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <section aria-labelledby="ganhos-dia" className="rounded-3xl border-2 border-blush-2 bg-white p-4">
              <h2 id="ganhos-dia" className="text-xl font-bold">
                Por dia
              </h2>
              <ul className="mt-2 flex flex-wrap gap-4 text-base" aria-label="Legenda">
                <li className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-sm" style={{ background: REALIZED_COLOR }} /> Realizado
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-sm" style={{ background: EXPECTED_COLOR }} /> Previsto
                </li>
              </ul>
              <div className="mt-3">
                <EarningsChart days={e.byDay} />
              </div>
              <details className="mt-3">
                <summary className="min-h-12 cursor-pointer py-2 font-bold underline underline-offset-4">Ver valores por dia</summary>
                <div className="overflow-x-auto">
                  <table className="mt-2 w-full text-left text-base">
                    <caption className="sr-only">Ganhos por dia</caption>
                    <thead>
                      <tr className="border-b border-blush-2">
                        <th scope="col" className="py-2 pr-3">
                          Dia
                        </th>
                        <th scope="col" className="py-2 pr-3 text-right">
                          Realizado
                        </th>
                        <th scope="col" className="py-2 text-right">
                          Previsto
                        </th>
                      </tr>
                    </thead>
                    <tbody className="tabular-nums">
                      {e.byDay.map((d) => (
                        <tr key={d.date} className="border-b border-blush-2/60">
                          <td className="py-1 pr-3 first-letter:uppercase">
                            {formatWeekday(d.date).replace("-feira", "")}, {formatDateShort(d.date)}
                          </td>
                          <td className="py-1 pr-3 text-right">{formatPrice(d.realizedCents)}</td>
                          <td className="py-1 text-right">{formatPrice(d.expectedCents)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </section>

            <div className="space-y-6">
              <section aria-labelledby="ganhos-servico" className="rounded-3xl border-2 border-blush-2 bg-white p-4">
                <h2 id="ganhos-servico" className="text-xl font-bold">
                  Por serviço
                </h2>
                {e.byService.length === 0 ? (
                  <p className="mt-2">Nenhum atendimento confirmado no período.</p>
                ) : (
                  <ul className="mt-2 divide-y divide-blush-2">
                    {e.byService.map((s) => (
                      <li key={s.name} className="flex flex-wrap items-baseline justify-between gap-x-3 py-2">
                        <span>
                          <span className="font-bold">{s.name}</span> · {s.count}
                        </span>
                        <span className="tabular-nums">{formatPrice(s.cents)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {isMaster && !prof && (
                <section aria-labelledby="ganhos-prof" className="rounded-3xl border-2 border-blush-2 bg-white p-4">
                  <h2 id="ganhos-prof" className="text-xl font-bold">
                    Por profissional
                  </h2>
                  {e.byProfessional.length === 0 ? (
                    <p className="mt-2">Nenhum atendimento confirmado no período.</p>
                  ) : (
                    <ul className="mt-2 divide-y divide-blush-2">
                      {e.byProfessional.map((p) => (
                        <li key={p.professionalId} className="flex flex-wrap items-baseline justify-between gap-x-3 py-2">
                          <span>
                            <span className="font-bold">{p.name}</span> · {count(p.count)}
                          </span>
                          <span className="tabular-nums">{formatPrice(p.cents)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, bucket, hero, swatch, hint }: { label: string; bucket: EarningsBucket; hero?: boolean; swatch?: string; hint?: string }) {
  return (
    <div className={`rounded-3xl p-5 ${hero ? "bg-cocoa text-white" : "border-2 border-blush-2 bg-white"}`}>
      <p className="flex items-center gap-2 font-bold">
        {swatch && <span className="inline-block h-3 w-3 rounded-sm" style={{ background: swatch }} />}
        {label}
      </p>
      <p className={`mt-1 font-bold ${hero ? "text-4xl" : "text-2xl text-coffee"}`}>{formatPrice(bucket.cents)}</p>
      <p className={`text-base ${hero ? "text-white/90" : "text-cocoa"}`}>
        {count(bucket.count)}
        {hint && ` · ${hint}`}
      </p>
    </div>
  );
}
