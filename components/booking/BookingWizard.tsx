"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { PublicCategory, PublicService } from "@/lib/domain/types";
import { useApi } from "@/lib/client/useApi";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { StepService } from "./StepService";
import { StepDay } from "./StepDay";
import { StepTime } from "./StepTime";
import { StepCustomer, type CustomerData } from "./StepCustomer";
import { StepReview } from "./StepReview";

export const TOTAL_STEPS = 5;
const DRAFT_KEY = "lb-booking-customer";

export type WizardParams = {
  passo: number;
  categoria?: string;
  servico?: string;
  data?: string;
  hora?: string;
  aviso?: string;
};

function readParams(sp: URLSearchParams): WizardParams {
  const n = Number(sp.get("passo") ?? 1);
  return {
    passo: Number.isInteger(n) && n >= 1 && n <= TOTAL_STEPS ? n : 1,
    categoria: sp.get("categoria") ?? undefined,
    servico: sp.get("servico") ?? undefined,
    data: sp.get("data") ?? undefined,
    hora: sp.get("hora") ?? undefined,
    aviso: sp.get("aviso") ?? undefined,
  };
}

function loadDraft(): CustomerData {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (raw) return JSON.parse(raw) as CustomerData;
  } catch {}
  return { name: "", phone: "", notes: "" };
}

function saveDraft(d: CustomerData) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  } catch {}
}

export function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {}
}

export function BookingWizard() {
  const router = useRouter();
  const sp = useSearchParams();
  const p = readParams(sp);
  const { data: catalog, error, reload } = useApi("services", api.services);
  const [customer, setCustomer] = useState<CustomerData>({ name: "", phone: "", notes: "" });
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Restaura o rascunho de nome/telefone (fica fora da URL por privacidade).
  useEffect(() => {
    const d = loadDraft();
    queueMicrotask(() => {
      setCustomer(d);
      setDraftLoaded(true);
    });
  }, []);

  const go = useCallback(
    (next: Partial<WizardParams>, replace = false) => {
      const merged: WizardParams = { ...p, aviso: undefined, ...next };
      const q = new URLSearchParams();
      for (const [k, v] of Object.entries(merged)) if (v !== undefined && v !== "") q.set(k, String(v));
      const url = `/agendar?${q.toString()}`;
      if (replace) router.replace(url, { scroll: true });
      else router.push(url, { scroll: true });
    },
    [p, router],
  );

  if (error) {
    return (
      <div role="alert" className="rounded-3xl bg-danger-bg p-5 text-danger">
        <p className="font-bold">Não foi possível carregar os serviços.</p>
        <Button variant="secondary" className="mt-4 w-full" onClick={reload}>
          Tentar de novo
        </Button>
      </div>
    );
  }
  if (!catalog || !draftLoaded) return <Spinner />;

  const all: { service: PublicService; category: PublicCategory }[] = catalog.categories.flatMap((c) =>
    c.services.map((s) => ({ service: s, category: c })),
  );
  const chosen = all.find((x) => x.service.id === p.servico);

  // Garante consistência: um passo só abre com as escolhas anteriores feitas.
  let step = p.passo;
  if (step >= 2 && !chosen) step = 1;
  if (step >= 3 && !p.data) step = 2;
  if (step >= 4 && !p.hora) step = 3;
  if (step >= 5 && (!customer.name || !customer.phone)) step = 4;

  const back = () => {
    if (step === 1 && p.categoria) return go({ passo: 1, categoria: undefined });
    if (step === 1) return router.push("/");
    go({ passo: step - 1 });
  };

  return (
    <div>
      <button
        type="button"
        onClick={back}
        className="-ml-2 mb-4 inline-flex min-h-12 items-center gap-1 rounded-2xl px-2 text-lg font-bold text-coffee hover:bg-blush"
      >
        <ArrowLeftIcon className="h-6 w-6" />
        Voltar
      </button>

      {step === 1 && (
        <StepService
          categories={catalog.categories}
          categoryId={p.categoria ?? chosen?.category.id}
          selectedId={p.servico}
          onCategory={(id) => go({ passo: 1, categoria: id })}
          onSelect={(s, c) => go({ passo: 2, servico: s.id, categoria: c.id, data: undefined, hora: undefined })}
        />
      )}
      {step === 2 && chosen && (
        <StepDay
          service={chosen.service}
          selected={p.data}
          onSelect={(date) => go({ passo: 3, data: date, hora: undefined })}
        />
      )}
      {step === 3 && chosen && p.data && (
        <StepTime
          service={chosen.service}
          date={p.data}
          selected={p.hora}
          notice={p.aviso === "ocupado" ? "Esse horário acabou de ser ocupado. Escolha outro." : undefined}
          onSelect={(time) => go({ passo: 4, hora: time })}
          onChangeDay={() => go({ passo: 2 })}
        />
      )}
      {step === 4 && (
        <StepCustomer
          value={customer}
          onSubmit={(d) => {
            setCustomer(d);
            saveDraft(d);
            go({ passo: 5 });
          }}
        />
      )}
      {step === 5 && chosen && p.data && p.hora && (
        <StepReview
          service={chosen.service}
          date={p.data}
          time={p.hora}
          customer={customer}
          onEdit={(target) => go({ passo: target })}
          onTaken={() => go({ passo: 3, hora: undefined, aviso: "ocupado" }, true)}
          onDone={(id) => {
            clearDraft();
            router.push(`/agendamento/${id}?novo=1`);
          }}
        />
      )}
    </div>
  );
}
