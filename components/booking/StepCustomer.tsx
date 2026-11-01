"use client";

import { useId, useState, type FormEvent } from "react";
import { maskPhoneInput } from "@/lib/domain/format";
import { parsePhoneBR, PHONE_MESSAGE } from "@/lib/domain/validation";
import { Button } from "@/components/ui/Button";
import { StepHeader } from "@/components/ui/StepHeader";

export type CustomerData = { name: string; phone: string; notes: string };

const input =
  "mt-2 block w-full rounded-2xl border-2 bg-white px-4 py-3 text-lg text-ink placeholder:text-coffee/75 focus:border-cocoa";

export function StepCustomer({ value, onSubmit }: { value: CustomerData; onSubmit: (d: CustomerData) => void }) {
  const [d, setD] = useState<CustomerData>(value);
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerData, string>>>({});
  const ids = { name: useId(), phone: useId(), notes: useId() };

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    const name = d.name.trim().replace(/\s+/g, " ");
    if (name.length < 2) errs.name = "Informe seu nome.";
    if (!parsePhoneBR(d.phone)) errs.phone = PHONE_MESSAGE;
    if (d.notes.trim().length > 300) errs.notes = "Use no máximo 300 caracteres.";
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(ids[Object.keys(errs)[0] as keyof CustomerData])?.focus();
      return;
    }
    onSubmit({ name, phone: d.phone, notes: d.notes.trim() });
  }

  const field = (k: keyof CustomerData) => ({
    id: ids[k],
    "aria-invalid": !!errors[k] || undefined,
    "aria-describedby": errors[k] ? `${ids[k]}-err` : undefined,
  });
  const err = (k: keyof CustomerData) =>
    errors[k] && (
      <p id={`${ids[k]}-err`} className="mt-2 font-bold text-danger">
        {errors[k]}
      </p>
    );

  return (
    <>
      <StepHeader step={4} total={5} title="Seus dados" />
      <p className="mb-5">Usamos seu WhatsApp para confirmar o horário.</p>
      <form onSubmit={submit} noValidate className="space-y-6">
        <div>
          <label htmlFor={ids.name} className="block font-bold">
            Seu nome
          </label>
          <input
            {...field("name")}
            autoComplete="name"
            value={d.name}
            onChange={(e) => setD({ ...d, name: e.target.value })}
            className={`${input} ${errors.name ? "border-danger" : "border-blush-2"}`}
          />
          {err("name")}
        </div>
        <div>
          <label htmlFor={ids.phone} className="block font-bold">
            WhatsApp com DDD
          </label>
          <input
            {...field("phone")}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="(21) 96811-7976"
            value={d.phone}
            onChange={(e) => setD({ ...d, phone: maskPhoneInput(e.target.value) })}
            className={`${input} ${errors.phone ? "border-danger" : "border-blush-2"}`}
          />
          {err("phone")}
        </div>
        <div>
          <label htmlFor={ids.notes} className="block font-bold">
            Observação <span className="font-normal">(opcional)</span>
          </label>
          <textarea
            {...field("notes")}
            rows={3}
            maxLength={300}
            placeholder="Ex.: quero francesinha"
            value={d.notes}
            onChange={(e) => setD({ ...d, notes: e.target.value })}
            className={`${input} ${errors.notes ? "border-danger" : "border-blush-2"}`}
          />
          {err("notes")}
        </div>
        <Button type="submit" className="w-full text-xl">
          Continuar
        </Button>
      </form>
    </>
  );
}
