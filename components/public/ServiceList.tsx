"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { api } from "@/lib/api-client";
import { formatDuration, formatPrice } from "@/lib/domain/format";
import type { PublicCategory, PublicService } from "@/lib/domain/types";
import { useApi } from "@/lib/client/useApi";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Spinner";
import { ChevronIcon } from "@/components/ui/icons";
import { ServicePhotoZoom } from "@/components/ui/ServicePhoto";

/** Agrupa serviços por subcategoria, preservando a ordem de chegada. */
export function groupBySubcategory(services: PublicService[]) {
  const groups: { title: string | null; items: PublicService[] }[] = [];
  for (const s of services) {
    const g = groups.find((x) => x.title === s.subcategory);
    if (g) g.items.push(s);
    else groups.push({ title: s.subcategory, items: [s] });
  }
  return groups;
}

export function ServiceList() {
  const { data, error, loading, reload } = useApi("services", api.services);
  const [open, setOpen] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Carregando serviços">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div role="alert" className="rounded-3xl bg-danger-bg p-5 text-danger">
        <p className="font-bold">Não foi possível carregar os serviços.</p>
        <Button variant="secondary" className="mt-4 w-full" onClick={reload}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Celular e tablet: categorias em sanfona. */}
      <div className="space-y-3 lg:hidden">
        {data.categories.map((c) => (
          <CategoryBlock
            key={c.id}
            category={c}
            open={open === c.id}
            onToggle={() => setOpen(open === c.id ? null : c.id)}
          />
        ))}
      </div>
      {/* Computador: abas por categoria e serviços em grade. */}
      <DesktopCatalog categories={data.categories} />
    </>
  );
}

function DesktopCatalog({ categories }: { categories: PublicCategory[] }) {
  const [tab, setTab] = useState(categories[0]?.id);
  const baseId = useId();
  const current = categories.find((c) => c.id === tab) ?? categories[0];
  if (!current) return null;
  return (
    <div className="hidden lg:block">
      <div role="tablist" aria-label="Categorias" className="flex justify-center gap-2">
        {categories.map((c) => {
          const on = c.id === current.id;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${c.id}`}
              aria-selected={on}
              aria-controls={`${baseId}-panel`}
              onClick={() => setTab(c.id)}
              className={`min-h-12 rounded-full border-2 px-6 font-brand text-lg font-semibold ${
                on ? "border-cocoa bg-cocoa text-white" : "border-blush-2 bg-white/80 text-coffee hover:border-cocoa"
              }`}
            >
              {c.name} <span className="font-sans text-base font-normal">({c.services.length})</span>
            </button>
          );
        })}
      </div>
      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${current.id}`}
        className="mt-6 rounded-3xl border border-blush-2 bg-white/60 p-6"
      >
        {current.note && <p className="mb-5 rounded-2xl bg-blush px-4 py-3 text-base">{current.note}</p>}
        {groupBySubcategory(current.services).map((g) => (
          <div key={g.title ?? "_"} className="mb-6 last:mb-0">
            {g.title && <h3 className="mb-3 text-base font-bold uppercase tracking-wide text-cocoa">{g.title}</h3>}
            <ul className="grid grid-cols-2 gap-3 xl:grid-cols-3">
              {g.items.map((s) => (
                <li key={s.id} className="flex items-center gap-3 rounded-2xl border border-blush-2 bg-white/80 p-4">
                  {s.photoUrl && <ServicePhotoZoom key={s.photoUrl} url={s.photoUrl} name={s.name} />}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-coffee">{s.name}</p>
                    <p className="text-base">
                      {formatDuration(s.durationMin)} ·{" "}
                      <span className="whitespace-nowrap font-bold text-cocoa">{formatPrice(s.priceCents)}</span>
                    </p>
                  </div>
                  <Link
                    href={`/agendar?servico=${encodeURIComponent(s.id)}&passo=2`}
                    className="inline-flex min-h-11 shrink-0 items-center rounded-2xl border-2 border-cocoa px-4 font-bold text-coffee hover:bg-blush"
                    aria-label={`Agendar ${s.name}`}
                  >
                    Agendar
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryBlock({ category, open, onToggle }: { category: PublicCategory; open: boolean; onToggle: () => void }) {
  const panelId = useId();
  const groups = groupBySubcategory(category.services);
  return (
    <section className="overflow-hidden rounded-3xl border border-blush-2 bg-white/80">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex min-h-16 w-full flex-wrap items-center justify-between gap-x-3 gap-y-1 px-5 py-4 text-left"
        >
          <span>
            <span className="block break-words font-brand text-xl font-semibold text-coffee">{category.name}</span>
            <span className="block text-base text-cocoa">
              {category.services.length} {category.services.length === 1 ? "serviço" : "serviços"}
            </span>
          </span>
          <span className="flex items-center gap-1 text-base font-bold text-cocoa">
            {open ? "Fechar" : "Ver"}
            <ChevronIcon open={open} className="h-6 w-6" />
          </span>
        </button>
      </h3>
      <div id={panelId} hidden={!open} className="border-t border-blush-2 px-5 pb-5">
        {category.note && <p className="mt-4 rounded-2xl bg-blush px-4 py-3 text-base">{category.note}</p>}
        {groups.map((g) => (
          <div key={g.title ?? "_"} className="mt-5">
            {g.title && <h4 className="mb-2 text-base font-bold uppercase tracking-wide text-cocoa">{g.title}</h4>}
            <ul className="divide-y divide-blush-2">
              {g.items.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 flex-1 basis-40 items-center gap-3">
                    {s.photoUrl && <ServicePhotoZoom key={s.photoUrl} url={s.photoUrl} name={s.name} />}
                    <div className="min-w-0">
                      <p className="font-bold text-coffee">{s.name}</p>
                      <p className="text-base">{formatDuration(s.durationMin)}</p>
                      <p className="whitespace-nowrap font-bold text-cocoa">{formatPrice(s.priceCents)}</p>
                    </div>
                  </div>
                  <Link
                    href={`/agendar?servico=${encodeURIComponent(s.id)}&passo=2`}
                    className="inline-flex min-h-12 shrink-0 items-center rounded-2xl border-2 border-cocoa px-4 font-bold text-coffee hover:bg-blush"
                    aria-label={`Agendar ${s.name}`}
                  >
                    Agendar
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
