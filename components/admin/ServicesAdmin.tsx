"use client";

import { useId, useState } from "react";
import { api } from "@/lib/api-client";
import { centsToInput, formatDurationShort, formatPrice } from "@/lib/domain/format";
import { parsePriceBRL } from "@/lib/domain/validation";
import type { Category, Professional, Service } from "@/lib/domain/types";
import { useApi } from "@/lib/client/useApi";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { DurationSelect, Field, PriceInput, inputClass } from "./fields";
import { ServiceForm } from "./ServiceForm";

const PRICE_ERROR = "Informe um valor em reais, ex.: 45,00";

export function ServicesAdmin() {
  const { data, stale, error, reload } = useApi("admin-catalog", api.admin.catalog);
  const catalog = data ?? stale;
  const [creating, setCreating] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const done = (msg: string) => {
    setFlash(msg);
    reload();
  };

  if (error && !catalog) return <p className="rounded-3xl bg-danger-bg p-5 font-bold text-danger">{error.message}</p>;
  if (!catalog) return <Spinner />;
  const { services, categories, professionals } = catalog;

  return (
    <div>
      <h1 className="font-brand text-2xl font-semibold">Serviços e valores</h1>
      <p className="mt-1 text-base">
        Altere preço e duração e toque em <strong>Salvar</strong>. A mudança vale na hora para as clientes. Agendamentos já
        feitos mantêm o valor e a duração do dia do pedido.
      </p>
      {flash && (
        <p role="status" className="mt-4 rounded-2xl bg-ok-bg px-4 py-3 font-bold text-ok">
          {flash}
        </p>
      )}

      <div className="mt-5">
        {creating ? (
          <div className="rounded-3xl border-2 border-cocoa bg-white p-5">
            <h2 className="mb-4 text-xl font-bold">Novo serviço</h2>
            <ServiceForm
              categories={categories}
              professionals={professionals}
              services={services}
              onCancel={() => setCreating(false)}
              onSaved={(s) => {
                setCreating(false);
                done(`Serviço "${s.name}" criado.`);
              }}
            />
          </div>
        ) : (
          <Button className="w-full" onClick={() => setCreating(true)}>
            + Novo serviço
          </Button>
        )}
      </div>

      {categories.map((c) => (
        <CategorySection
          key={`${c.id}:${c.note ?? ""}`}
          category={c}
          services={services.filter((s) => s.categoryId === c.id)}
          allServices={services}
          categories={categories}
          professionals={professionals}
          onSaved={done}
        />
      ))}

      <ProfessionalsSection professionals={professionals} onSaved={done} />
    </div>
  );
}

function CategorySection({
  category,
  services,
  allServices,
  categories,
  professionals,
  onSaved,
}: {
  category: Category;
  services: Service[];
  allServices: Service[];
  categories: Category[];
  professionals: Professional[];
  onSaved: (msg: string) => void;
}) {
  const [note, setNote] = useState(category.note ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const id = useId();
  const dirty = note.trim() !== (category.note ?? "");

  async function saveNote() {
    setBusy(true);
    setErr(null);
    try {
      await api.admin.updateCategory(category.id, { note: note.trim() || null });
      onSaved(`Aviso de ${category.name} atualizado.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8">
      <h2 className="font-brand text-2xl font-semibold text-coffee">{category.name}</h2>
      <div className="mt-3 rounded-3xl bg-blush p-4">
        <Field id={id} label="Aviso para as clientes (aparece ao abrir a categoria)" error={err ?? undefined}>
          <textarea id={id} value={note} maxLength={200} rows={2} onChange={(e) => setNote(e.target.value)} className={inputClass} />
        </Field>
        <Button variant="secondary" className="mt-3 w-full" disabled={!dirty || busy} onClick={saveNote}>
          {busy ? "Salvando..." : "Salvar aviso"}
        </Button>
      </div>
      {services.length === 0 ? (
        <p className="mt-3 text-base">Nenhum serviço nesta categoria.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {services.map((s) => (
            <li key={`${s.id}:${s.priceCents}:${s.durationMin}:${s.name}:${s.active}`}>
              <ServiceRow
                service={s}
                professionals={professionals}
                categories={categories}
                allServices={allServices}
                onSaved={onSaved}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ServiceRow({
  service,
  professionals,
  categories,
  allServices,
  onSaved,
}: {
  service: Service;
  professionals: Professional[];
  categories: Category[];
  allServices: Service[];
  onSaved: (msg: string) => void;
}) {
  const [price, setPrice] = useState(centsToInput(service.priceCents));
  const [duration, setDuration] = useState(service.durationMin);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const priceId = useId();
  const durId = useId();

  const parsed = price.trim() === "" ? null : parsePriceBRL(price);
  const priceInvalid = price.trim() !== "" && parsed === null;
  const dirty = (parsed ?? null) !== service.priceCents || duration !== service.durationMin;
  const prof = professionals.find((p) => p.id === service.professionalId);

  async function save() {
    if (priceInvalid) return setErr(PRICE_ERROR);
    setBusy(true);
    setErr(null);
    try {
      const patch: { priceCents?: number | null; durationMin?: number } = {};
      if (parsed !== service.priceCents) patch.priceCents = parsed;
      if (duration !== service.durationMin) patch.durationMin = duration;
      await api.admin.updateService(service.id, patch);
      onSaved(`${service.name}: ${formatPrice(parsed)} · ${formatDurationShort(duration)}.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <div className="rounded-3xl border-2 border-cocoa bg-white p-5">
        <h3 className="mb-4 text-xl font-bold">Editar {service.name}</h3>
        <ServiceForm
          service={service}
          categories={categories}
          professionals={professionals}
          services={allServices}
          onCancel={() => setEditing(false)}
          onSaved={(s) => {
            setEditing(false);
            onSaved(`Serviço "${s.name}" atualizado.`);
          }}
        />
      </div>
    );
  }

  return (
    <div className={`rounded-3xl border-2 bg-white/90 p-4 ${service.active ? "border-blush-2" : "border-dashed border-cocoa/40 opacity-80"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-bold text-coffee">{service.name}</p>
        {service.durationEstimated && (
          <span className="rounded-full bg-warn-bg px-3 py-0.5 text-base font-bold text-warn">duração estimada</span>
        )}
        {!service.active && <span className="rounded-full bg-blush-2 px-3 py-0.5 text-base font-bold">Inativo</span>}
      </div>
      <p className="text-base text-cocoa">
        {service.subcategory ? `${service.subcategory} · ` : ""}
        {prof?.name ?? "Sem profissional"}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field id={priceId} label="Preço" error={priceInvalid ? PRICE_ERROR : undefined}>
          <PriceInput
            id={priceId}
            value={price}
            aria-invalid={priceInvalid || undefined}
            aria-describedby={priceInvalid ? `${priceId}-err` : undefined}
            onChange={(e) => setPrice(e.target.value)}
          />
        </Field>
        <Field id={durId} label="Duração">
          <DurationSelect id={durId} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
        </Field>
      </div>
      {price.trim() === "" && <p className="mt-1 text-base">Sem preço: a cliente vê &quot;Consultar valor&quot;.</p>}
      {err && !priceInvalid && <p className="mt-2 font-bold text-danger">{err}</p>}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Button onClick={save} disabled={!dirty || busy || priceInvalid}>
          {busy ? "Salvando..." : "Salvar"}
        </Button>
        <Button variant="secondary" onClick={() => setEditing(true)}>
          Editar tudo
        </Button>
      </div>
    </div>
  );
}

function ProfessionalsSection({ professionals, onSaved }: { professionals: Professional[]; onSaved: (m: string) => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const id = useId();

  async function add() {
    setBusy(true);
    setErr(null);
    try {
      const p = await api.admin.createProfessional(name);
      setName("");
      onSaved(`${p.name} cadastrada.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10">
      <h2 className="font-brand text-2xl font-semibold">Profissionais</h2>
      <ul className="mt-3 space-y-1">
        {professionals.map((p) => (
          <li key={p.id} className="rounded-2xl bg-white/80 px-4 py-3 font-bold">
            {p.name}
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <Field id={id} label="Nova profissional" error={err ?? undefined}>
          <input id={id} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} autoComplete="off" />
        </Field>
        <Button variant="secondary" className="mt-3 w-full" disabled={busy || name.trim().length < 2} onClick={add}>
          Cadastrar profissional
        </Button>
      </div>
    </section>
  );
}
