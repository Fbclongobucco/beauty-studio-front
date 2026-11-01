"use client";

import type { CSSProperties } from "react";
import { GRID_ROWS, layoutDay } from "@/lib/domain/agenda-layout";
import { formatDateShort, formatWeekday, STATUS_LABEL } from "@/lib/domain/format";
import { fromMinutes, OPEN_MIN, STEP_MIN, toMinutes } from "@/lib/domain/schedule";
import type { AdminAppointment } from "@/lib/domain/types";

const ROW = "2.25rem";

const BLOCK_STYLE = {
  pending: "border-warn bg-warn-bg text-warn",
  confirmed: "border-ok bg-ok-bg text-ok",
  rejected: "border-danger bg-danger-bg text-danger opacity-70",
  cancelled: "border-danger bg-danger-bg text-danger opacity-70",
} as const;

const endTime = (a: AdminAppointment) => fromMinutes(toMinutes(a.time) + a.durationMin);

type Props = {
  days: string[];
  today: string;
  list: AdminAppointment[];
  selectedId: string | null;
  showProfessional: boolean;
  onSelect: (a: AdminAppointment) => void;
};

/** Grade semanal (computador): colunas de segunda a sábado, linhas de 30 min das 09:00 às 20:00. */
export function WeekGrid({ days, today, list, selectedId, showProfessional, onSelect }: Props) {
  const rows: CSSProperties = { gridTemplateRows: `auto repeat(${GRID_ROWS}, ${ROW})` };
  return (
    <div className="grid grid-cols-[3.5rem_repeat(6,minmax(0,1fr))] rounded-3xl border-2 border-blush-2 bg-white/90" style={rows}>
      <div className="sticky top-[var(--admin-top)] z-10 rounded-tl-3xl bg-white" />
      {days.map((d) => (
        <div
          key={d}
          className={`sticky top-[var(--admin-top)] z-10 border-l border-blush-2 bg-white px-2 py-2 text-center ${d === today ? "text-coffee" : "text-cocoa"}`}
        >
          <span className="block text-base font-bold first-letter:uppercase">{formatWeekday(d).replace("-feira", "")}</span>
          <span className={`text-base ${d === today ? "rounded-full bg-cocoa px-2 font-bold text-white" : ""}`}>
            {formatDateShort(d)}
          </span>
        </div>
      ))}

      {/* Horários a cada hora. */}
      {Array.from({ length: GRID_ROWS }, (_, i) => (
        <div key={i} className="border-t border-blush-2 pr-2 text-right text-sm text-cocoa" style={{ gridColumn: 1, gridRow: i + 2 }}>
          {i % 2 === 0 ? fromMinutes(OPEN_MIN + i * STEP_MIN) : ""}
        </div>
      ))}

      {days.map((d, col) => {
        const items = list.filter((a) => a.date === d);
        const layout = new Map(layoutDay(items).map((b) => [b.id, b]));
        return (
          <section
            key={d}
            aria-label={`${formatWeekday(d)}, ${formatDateShort(d)}: ${items.length} agendamento${items.length === 1 ? "" : "s"}`}
            className="relative border-l border-blush-2"
            style={{
              gridColumn: col + 2,
              gridRow: `2 / span ${GRID_ROWS}`,
              backgroundImage: `repeating-linear-gradient(to bottom, var(--color-blush-2) 0 1px, transparent 1px ${ROW})`,
            }}
          >
            {items.map((a) => {
              const b = layout.get(a.id)!;
              const selected = a.id === selectedId;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onSelect(a)}
                  aria-pressed={selected}
                  aria-label={`${a.time} às ${endTime(a)}, ${a.customerName}, ${a.serviceName}${
                    showProfessional ? `, com ${a.professionalName}` : ""
                  }, ${STATUS_LABEL[a.status]}${a.conflict ? ", conflito de horário" : ""}`}
                  className={`absolute overflow-hidden rounded-xl border-l-4 py-0.5 ${b.lanes > 2 ? "px-1" : "px-2"} text-left text-sm leading-tight shadow-sm hover:brightness-95 ${
                    BLOCK_STYLE[a.status]
                  } ${selected ? "outline outline-3 outline-coffee" : ""} ${a.conflict ? "ring-2 ring-danger" : ""}`}
                  style={{
                    top: `calc(${b.row - 1} * ${ROW} + 1px)`,
                    height: `calc(${b.span} * ${ROW} - 2px)`,
                    left: `calc(${b.lane} * 100% / ${b.lanes} + 1px)`,
                    width: `calc(100% / ${b.lanes} - 2px)`,
                  }}
                >
                  <span className="block truncate font-bold">{b.lanes > 1 || b.span < 2 ? a.time : `${a.time}–${endTime(a)}`}</span>
                  <span className="block truncate text-ink">{a.customerName}</span>
                  <span className="block truncate text-ink">{a.serviceName}</span>
                  {showProfessional && <span className="block truncate">{a.professionalName.split(" ")[0]}</span>}
                </button>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
