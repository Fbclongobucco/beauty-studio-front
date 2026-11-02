"use client";

import { useId, useState } from "react";
import { api, ApiRequestError } from "@/lib/api-client";
import { formatPhone, maskPhoneInput } from "@/lib/domain/format";
import { parsePhoneBR, PHONE_MESSAGE } from "@/lib/domain/validation";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "./fields";
import { useAdmin } from "./AdminShell";

/** A profissional informa o próprio WhatsApp, que recebe o aviso de cada pedido novo. Só para profissional. */
export function MyWhatsApp() {
  const { session, setSession } = useAdmin();
  const id = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session.role !== "professional") return null;
  const current = session.whatsappPhone;

  async function send(whatsappPhone: string | null, okText: string) {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      setSession(await api.admin.updateMe({ whatsappPhone }));
      setValue("");
      setDone(okText);
    } catch (e) {
      // Mantém o que foi digitado; mostra o erro da API ao lado do campo
      setError(
        e instanceof ApiRequestError && e.fields?.whatsappPhone
          ? e.fields.whatsappPhone
          : e instanceof Error
            ? e.message
            : "Não foi possível salvar.",
      );
    } finally {
      setBusy(false);
    }
  }

  function save() {
    // Campo vazio não remove: a remoção tem botão próprio
    if (!parsePhoneBR(value)) {
      setDone(null);
      setError(PHONE_MESSAGE);
      return;
    }
    void send(value, "WhatsApp salvo");
  }

  return (
    <section id="meu-whatsapp" aria-labelledby={`${id}-t`} className="mb-10 scroll-mt-32 rounded-3xl bg-blush p-5 lg:max-w-xl">
      <h2 id={`${id}-t`} className="font-brand text-2xl font-semibold lg:text-3xl">
        Meu WhatsApp
      </h2>
      <p className="mt-2 text-base">Este número recebe o aviso de cada pedido novo seu.</p>
      <p className="mt-3 font-bold text-coffee">
        {current ? `Número atual: ${formatPhone(current)}` : "Nenhum número cadastrado"}
      </p>
      <div className="mt-4">
        <Field id={id} label={current ? "Trocar o número" : "WhatsApp com DDD"} error={error ?? undefined}>
          <input
            id={id}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="(21) 96811-7976"
            value={value}
            onChange={(e) => setValue(maskPhoneInput(e.target.value))}
            aria-invalid={!!error || undefined}
            aria-describedby={error ? `${id}-err` : undefined}
            className={inputClass}
          />
        </Field>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button onClick={save} disabled={busy} className="lg:min-h-11 lg:text-base">
          {busy ? "Salvando..." : "Salvar"}
        </Button>
        {current && (
          <Button
            variant="secondary"
            onClick={() => send(null, "WhatsApp removido")}
            disabled={busy}
            className="lg:min-h-11 lg:text-base"
          >
            Remover número
          </Button>
        )}
      </div>
      {done && (
        <p role="status" className="mt-3 font-bold text-ok">
          {done}
        </p>
      )}
    </section>
  );
}
