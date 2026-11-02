"use client";

import { useEffect, useId, useState, type ChangeEvent, type FormEvent } from "react";
import { api, ApiRequestError } from "@/lib/api-client";
import { resizePhoto, PhotoError } from "@/lib/client/resize-photo";
import { centsToInput } from "@/lib/domain/format";
import { PHOTO_ACCEPT, PHOTO_MESSAGES } from "@/lib/domain/photo";
import { parsePriceBRL } from "@/lib/domain/validation";
import type { Category, Professional, Service } from "@/lib/domain/types";
import { Button, buttonClass } from "@/components/ui/Button";
import { ServiceThumb } from "@/components/ui/ServicePhoto";
import { DurationSelect, Field, PriceInput, inputClass } from "./fields";

const NEW = "__nova__";

/** Foto pendente no formulário: só é gravada no "Salvar". */
type PhotoDraft = { kind: "keep" } | { kind: "new"; blob: Blob; previewUrl: string } | { kind: "remove" };

const PHOTO_SAVE_FAILED = "Serviço salvo, mas a foto não foi enviada. Tente de novo.";

type Props = {
  service?: Service;
  categories: Category[];
  professionals: Professional[];
  services: Service[];
  onSaved: (s: Service) => void;
  onCancel: () => void;
  /** Profissional: sem troca de responsável e sem criar categoria (o servidor também impede). */
  isMaster?: boolean;
};

export function ServiceForm({ service, categories, professionals, services, onSaved, onCancel, isMaster = true }: Props) {
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
  const [photo, setPhoto] = useState<PhotoDraft>({ kind: "keep" });
  const [preparing, setPreparing] = useState(false);
  /** Serviço já gravado quando só a foto falhou: o próximo "Salvar" trata como edição. */
  const [saved, setSaved] = useState<Service | null>(null);
  const ids = { name: useId(), cat: useId(), newCat: useId(), sub: useId(), dur: useId(), price: useId(), prof: useId(), list: useId(), photo: useId() };

  const base = saved ?? service;
  const previewUrl = photo.kind === "new" ? photo.previewUrl : null;
  // Libera a pré-visualização ao trocar de foto, cancelar ou fechar o formulário.
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);
  const shownPhoto = photo.kind === "new" ? photo.previewUrl : photo.kind === "keep" ? (base?.photoUrl ?? null) : null;

  async function pickPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite escolher o mesmo arquivo de novo
    if (!file) return;
    setPreparing(true);
    setErrors((x) => {
      const next = { ...x };
      delete next.photo;
      return next;
    });
    try {
      const blob = await resizePhoto(file);
      setPhoto({ kind: "new", blob, previewUrl: URL.createObjectURL(blob) });
    } catch (err) {
      setErrors((x) => ({ ...x, photo: err instanceof PhotoError ? err.message : PHOTO_MESSAGES.type }));
    } finally {
      setPreparing(false);
    }
  }

  function removePhoto() {
    // Foto nova ainda não salva e serviço sem foto: só descarta a escolha.
    setPhoto(base?.photoUrl ? { kind: "remove" } : { kind: "keep" });
  }

  /** Grava a foto pendente depois do serviço. */
  async function savePhoto(svc: Service): Promise<Service> {
    if (photo.kind === "new") return api.admin.setServicePhoto(svc.id, photo.blob);
    if (photo.kind === "remove" && svc.photoUrl) return api.admin.removeServicePhoto(svc.id);
    return svc;
  }

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
    let svc: Service;
    try {
      let catId = categoryId;
      if (catId === NEW) {
        catId = (await api.admin.createCategory(newCategory.trim())).id;
        setCategoryId(catId); // numa nova tentativa, não cria a categoria de novo
      }
      const body = {
        name: name.trim(),
        categoryId: catId,
        subcategory: subcategory.trim() || null,
        durationMin: duration,
        priceCents,
        // Para a profissional, o servidor define a responsável (ela mesma).
        ...(isMaster ? { professionalId } : {}),
        active,
      };
      if (base) {
        // Só envia a duração se mudou, para não apagar a marca de "estimada" sem revisão.
        const { durationMin, ...rest } = body;
        const patch = durationMin !== base.durationMin ? body : rest;
        const changed = Object.entries(patch).some(([k, v]) => base[k as keyof Service] !== v);
        // Nova tentativa só da foto: o serviço já está gravado e nada mudou.
        svc = saved && !changed ? saved : await api.admin.updateService(base.id, patch);
      } else {
        svc = await api.admin.createService(body);
      }
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiRequestError && err.fields) setErrors(err.fields);
      else setErrors({ form: err instanceof Error ? err.message : "Erro ao salvar." });
      return;
    }
    try {
      onSaved(await savePhoto(svc));
    } catch (err) {
      setSaved(svc);
      setBusy(false);
      setErrors({
        form: PHOTO_SAVE_FAILED,
        ...(err instanceof ApiRequestError && err.fields?.photo ? { photo: err.fields.photo } : {}),
      });
    }
  }

  // Cancelar depois de o serviço já ter sido gravado (só a foto falhou) ainda atualiza a lista.
  const cancel = () => (saved ? onSaved(saved) : onCancel());

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
          {isMaster && <option value={NEW}>+ Nova categoria…</option>}
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
      {isMaster && (
        <Field id={ids.prof} label="Profissional" error={errors.professionalId}>
          <select id={ids.prof} value={professionalId} onChange={(e) => setProfessionalId(e.target.value)} className={inputClass}>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      <fieldset>
        <legend className="block text-base font-bold">Foto (opcional)</legend>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          {shownPhoto ? (
            <ServiceThumb key={shownPhoto} url={shownPhoto} alt={`Foto de ${name.trim() || "serviço"}`} className="h-24 w-24" />
          ) : (
            <p className="text-base text-cocoa">{photo.kind === "remove" ? "A foto será removida ao salvar." : "Sem foto."}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <label htmlFor={ids.photo} className={buttonClass("secondary", "min-h-12 cursor-pointer px-4 text-base")}>
              {preparing ? "Preparando foto..." : shownPhoto ? "Trocar foto" : "Escolher foto"}
            </label>
            <input
              id={ids.photo}
              type="file"
              accept={PHOTO_ACCEPT}
              onChange={pickPhoto}
              disabled={preparing || busy}
              aria-invalid={!!errors.photo || undefined}
              aria-describedby={errors.photo ? `${ids.photo}-err` : undefined}
              className="sr-only"
            />
            {shownPhoto && (
              <Button variant="ghost" className="min-h-12 px-2 text-base" onClick={removePhoto} disabled={preparing || busy}>
                Remover foto
              </Button>
            )}
          </div>
        </div>
        {errors.photo && (
          <p id={`${ids.photo}-err`} className="mt-1 text-base font-bold text-danger">
            {errors.photo}
          </p>
        )}
      </fieldset>
      <label className="flex min-h-12 items-center gap-3 font-bold">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-6 w-6 accent-cocoa" />
        Ativo (aparece para as clientes)
      </label>
      {errors.form && <p className="font-bold text-danger">{errors.form}</p>}
      <div className="grid grid-cols-2 gap-3">
        <Button type="submit" disabled={busy || preparing}>
          {busy ? "Salvando..." : "Salvar"}
        </Button>
        <Button variant="secondary" onClick={cancel} disabled={busy}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
