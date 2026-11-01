"use client";

import { useId, useState, type FormEvent } from "react";
import { api, ApiRequestError } from "@/lib/api-client";
import { centsToInput } from "@/lib/domain/format";
import { parsePriceBRL } from "@/lib/domain/validation";
import type { Category, Professional, Service } from "@/lib/domain/types";
import { Button } from "@/components/ui/Button";
import { DurationSelect, Field, PriceInput, inputClass } from "./fields";

const NEW = "__nova__";

type Props = {
  service?: Service;
  categories: Category[];
  professionals: Professional[];
  services: Service[];
  onSaved: (s: Service) => void;
  onCancel: () => void;
};

export function ServiceForm({ service, categories, professionals, services, onSaved, onCancel }: Props) {
  const [name, setName] = useState(service?.name ?? "");
  const [categoryId, setCategoryId] = useState(service?.categoryId ?? categories[0]?.id ?? NEW);
  const [newCategory, setNewCategory] = useState("");
  const [subcategory, setSubcategory] = useState(service?.subcategory ?? "");
  const [duration, setDuration] = useState(service?.durationMin ?? 60);
  const [price, setPrice] = useState(centsToInput(service?.priceCents ?? null));
  const [professionalId, setProfessionalId] = useState(service?.professionalId ?? professionals[0]?.id ?? "");
  const [active, setActive] = useState(service?.active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const ids = { name: useId(), cat: useId(), newCat: useId(), sub: useId(), dur: useId(), price: useId(), prof: useId(), list: useId() };

  const subOptions = [
    ...new Set(services.filter((s) => s.categoryId === categoryId && s.subcategory).map((s) => s.subcategory as string)),
  ];

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = "Informe o nome do serviço.";
    if (categoryId === NEW && newCategory.trim().length < 2) errs.newCategory = "Informe o nome da nova categoria.";
    const priceCents = price.trim() === "" ? null : parsePriceBRL(price);
    if (price.trim() !== "" && priceCents === null) errs.priceCents = "Informe um valor em reais, ex.: 45,00";
    if (!professionalId) errs.professionalId = "Escolha a profissional.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      let catId = categoryId;
      if (catId === NEW) catId = (await api.admin.createCategory(newCategory.trim())).id;
      const body = {
        name: name.trim(),
        categoryId: catId,
        subcategory: subcategory.trim() || null,
        durationMin: duration,
        priceCents,
        professionalId,
        active,
      };
      let saved: Service;
      if (service) {
        // Só envia a duração se mudou, para não apagar a marca de "estimada" sem revisão.
        const { durationMin, ...rest } = body;
        saved = await api.admin.updateService(service.id, durationMin !== service.durationMin ? body : rest);
      } else {
        saved = await api.admin.createService(body);
      }
      onSaved(saved);
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiRequestError && err.fields) setErrors(err.fields);
      else setErrors({ form: err instanceof Error ? err.message : "Erro ao salvar." });
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field id={ids.name} label="Nome do serviço" error={errors.name}>
        <input id={ids.name} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </Field>
      <Field id={ids.cat} label="Categoria" error={errors.categoryId}>
        <select id={ids.cat} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value={NEW}>+ Nova categoria…</option>
        </select>
      </Field>
      {categoryId === NEW && (
        <Field id={ids.newCat} label="Nome da nova categoria" error={errors.newCategory}>
          <input id={ids.newCat} value={newCategory} maxLength={40} onChange={(e) => setNewCategory(e.target.value)} className={inputClass} />
        </Field>
      )}
      <Field id={ids.sub} label="Subcategoria (opcional)" error={errors.subcategory}>
        <input
          id={ids.sub}
          list={ids.list}
          value={subcategory}
          maxLength={60}
          onChange={(e) => setSubcategory(e.target.value)}
          className={inputClass}
        />
        <datalist id={ids.list}>
          {subOptions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field id={ids.dur} label="Duração" error={errors.durationMin}>
          <DurationSelect id={ids.dur} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
        </Field>
        <Field id={ids.price} label="Preço" error={errors.priceCents}>
          <PriceInput id={ids.price} value={price} onChange={(e) => setPrice(e.target.value)} aria-invalid={!!errors.priceCents || undefined} />
        </Field>
      </div>
      <Field id={ids.prof} label="Profissional" error={errors.professionalId}>
        <select id={ids.prof} value={professionalId} onChange={(e) => setProfessionalId(e.target.value)} className={inputClass}>
          {professionals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>
      <label className="flex min-h-12 items-center gap-3 font-bold">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-6 w-6 accent-cocoa" />
        Ativo (aparece para as clientes)
      </label>
      {errors.form && <p className="font-bold text-danger">{errors.form}</p>}
      <div className="grid grid-cols-2 gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? "Salvando..." : "Salvar"}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
