"use client";

import { useEffect, useRef, useState } from "react";
import { formatDateShort, formatPrice, formatWeekday } from "@/lib/domain/format";
import type { EarningsResponse } from "@/lib/domain/types";

// Validadas com a skill dataviz sobre fundo branco: faixa de luminosidade, croma,
// separação para daltonismo (ΔE 21,8) e contraste ≥ 3:1 nas duas.
export const REALIZED_COLOR = "#7d3a22";
export const EXPECTED_COLOR = "#c47a4b";
const GRID = "#f1d2c4";

const H = 200;
const PAD = { top: 12, right: 8, bottom: 28, left: 64 };
const GAP = 2;

/** Teto "redondo" para o eixo: 1, 2 ou 5 × 10^n reais. */
function niceMax(cents: number): number {
  if (cents <= 0) return 10000;
  const reais = cents / 100;
  const pow = 10 ** Math.floor(Math.log10(reais));
  const step = [1, 2, 5, 10].find((m) => m * pow >= reais)!;
  return step * pow * 100;
}

const axisPrice = (cents: number) => `R$ ${(cents / 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;

/** Barras empilhadas por dia (realizado embaixo, previsto em cima), com dica ao passar o mouse. */
export function EarningsChart({ days }: { days: EarningsResponse["byDay"] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const max = niceMax(Math.max(0, ...days.map((d) => d.realizedCents + d.expectedCents)));
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = H - PAD.top - PAD.bottom;
  const slot = days.length ? plotW / days.length : 0;
  const barW = Math.max(2, Math.min(24, slot * 0.6));
  const y = (cents: number) => (cents / max) * plotH;
  const labelEvery = Math.max(1, Math.ceil(days.length / Math.max(1, Math.floor(plotW / 56))));
  const ticks = [0, max / 2, max];
  const tip = hover !== null ? days[hover] : null;

  return (
    <div ref={wrap} className="relative w-full" onMouseLeave={() => setHover(null)}>
      {width > 0 && (
        <svg width={width} height={H} aria-hidden="true" className="block">
          {ticks.map((t) => {
            const ty = PAD.top + plotH - y(t);
            return (
              <g key={t}>
                <line x1={PAD.left} x2={width - PAD.right} y1={ty} y2={ty} stroke={GRID} strokeWidth={1} />
                <text x={PAD.left - 8} y={ty} dy="0.32em" textAnchor="end" className="fill-cocoa text-[13px] tabular-nums">
                  {axisPrice(t)}
                </text>
              </g>
            );
          })}
          {days.map((d, i) => {
            const cx = PAD.left + slot * i + slot / 2;
            const x = cx - barW / 2;
            const base = PAD.top + plotH;
            const rH = y(d.realizedCents);
            const eH = y(d.expectedCents);
            // Arredonda só a ponta superior da pilha (4 px), base reta.
            const r = Math.min(4, barW / 2);
            const seg = (top: number, h: number, color: string, rounded: boolean) =>
              h <= 0 ? null : rounded ? (
                <path
                  d={`M${x},${top + h} V${top + Math.min(r, h)} Q${x},${top} ${x + Math.min(r, h)},${top} H${x + barW - Math.min(r, h)} Q${x + barW},${top} ${x + barW},${top + Math.min(r, h)} V${top + h} Z`}
                  fill={color}
                />
              ) : (
                <rect x={x} y={top} width={barW} height={h} fill={color} />
              );
            const gap = rH > 0 && eH > 0 ? GAP : 0;
            return (
              <g key={d.date} opacity={hover === null || hover === i ? 1 : 0.55}>
                {seg(base - rH, rH, REALIZED_COLOR, eH <= 0)}
                {seg(base - rH - gap - eH, eH, EXPECTED_COLOR, true)}
                {i % labelEvery === 0 && (
                  <text x={cx} y={H - 8} textAnchor="middle" className="fill-cocoa text-[13px] tabular-nums">
                    {formatDateShort(d.date)}
                  </text>
                )}
                {/* Área de toque maior que a barra. */}
                <rect
                  x={PAD.left + slot * i}
                  y={PAD.top}
                  width={slot}
                  height={plotH}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                />
              </g>
            );
          })}
        </svg>
      )}
      {tip && hover !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 w-56 rounded-2xl border border-blush-2 bg-white px-3 py-2 text-base shadow-md"
          style={{
            left: Math.min(Math.max(0, PAD.left + slot * hover + slot / 2 - 112), Math.max(0, width - 224)),
          }}
        >
          <p className="font-bold first-letter:uppercase">
            {formatWeekday(tip.date)}, {formatDateShort(tip.date)}
          </p>
          <p className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: REALIZED_COLOR }} />
            Realizado: <span className="tabular-nums">{formatPrice(tip.realizedCents)}</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: EXPECTED_COLOR }} />
            Previsto: <span className="tabular-nums">{formatPrice(tip.expectedCents)}</span>
          </p>
        </div>
      )}
    </div>
  );
}
