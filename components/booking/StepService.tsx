"use client";

import type { PublicCategory, PublicService } from "@/lib/domain/types";
import { formatDuration, formatPrice } from "@/lib/domain/format";
import { StepHeader } from "@/components/ui/StepHeader";
import { groupBySubcategory } from "@/components/public/ServiceList";
import { ServiceThumb } from "@/components/ui/ServicePhoto";

type Props = {
  categories: PublicCategory[];
  categoryId?: string;
  selectedId?: string;
  onCategory: (id: string) => void;
  onSelect: (s: PublicService, c: PublicCategory) => void;
};

export function StepService({ categories, categoryId, selectedId, onCategory, onSelect }: Props) {
  const category = categories.find((c) => c.id === categoryId);

  if (!category) {
    return (
      <>
        <StepHeader step={1} total={5} title="O que você deseja fazer?" />
        <ul className="space-y-3 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
          {categories.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onCategory(c.id)}
                className="flex min-h-20 w-full items-center justify-between rounded-3xl border-2 border-blush-2 bg-white/80 px-5 text-left hover:border-cocoa lg:min-h-36 lg:flex-col lg:items-start lg:justify-center lg:gap-2"
              >
                <span className="font-brand text-2xl font-semibold text-coffee">{c.name}</span>
                <span className="text-base text-cocoa">
                  {c.services.length} {c.services.length === 1 ? "opção" : "opções"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </>
    );
  }

  return (
    <>
      <StepHeader step={1} total={5} title={`Escolha o serviço de ${category.name.toLowerCase()}`} />
      {category.note && <p className="mb-4 rounded-2xl bg-blush px-4 py-3 text-base">{category.note}</p>}
      {groupBySubcategory(category.services).map((g) => (
        <div key={g.title ?? "_"} className="mb-6">
          {g.title && <h2 className="mb-2 text-base font-bold uppercase tracking-wide text-cocoa">{g.title}</h2>}
          <ul className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
            {g.items.map((s) => {
              const sel = s.id === selectedId;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    aria-pressed={sel}
                    onClick={() => onSelect(s, category)}
                    className={`flex min-h-16 w-full items-center justify-between gap-3 rounded-3xl border-2 px-5 py-3 text-left lg:h-full ${
                      sel ? "border-cocoa bg-blush-2" : "border-blush-2 bg-white/80 hover:border-cocoa"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      {s.photoUrl && <ServiceThumb key={s.photoUrl} url={s.photoUrl} alt={s.name} />}
                      <span>
                        <span className="block font-bold text-coffee">{s.name}</span>
                        <span className="block text-base">{formatDuration(s.durationMin)}</span>
                      </span>
                    </span>
                    <span className="whitespace-nowrap font-bold text-cocoa">{formatPrice(s.priceCents)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}
