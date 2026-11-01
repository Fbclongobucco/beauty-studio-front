"use client";

import type { ComponentProps, ReactNode } from "react";
import { MAX_DURATION, MIN_DURATION, STEP_MIN } from "@/lib/domain/schedule";
import { formatDurationShort } from "@/lib/domain/format";

export const inputClass =
  "mt-1 block w-full min-h-12 rounded-2xl border-2 border-blush-2 bg-white px-3 py-2 text-lg focus:border-cocoa aria-[invalid=true]:border-danger";

export const DURATIONS = Array.from(
  { length: (MAX_DURATION - MIN_DURATION) / STEP_MIN + 1 },
  (_, i) => MIN_DURATION + i * STEP_MIN,
);

export function Field({ label, error, children, id }: { label: string; error?: string; children: ReactNode; id: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-base font-bold">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-err`} className="mt-1 text-base font-bold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function DurationSelect(props: ComponentProps<"select">) {
  return (
    <select {...props} className={inputClass}>
      {DURATIONS.map((d) => (
        <option key={d} value={d}>
          {formatDurationShort(d)}
        </option>
      ))}
    </select>
  );
}

export function PriceInput(props: ComponentProps<"input">) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 mt-0.5 -translate-y-1/2 text-lg text-cocoa">R$</span>
      <input {...props} inputMode="decimal" placeholder="0,00" className={`${inputClass} pl-11`} />
    </div>
  );
}
