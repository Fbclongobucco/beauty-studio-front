import type { Category, Professional, Service } from "@/lib/domain/types";

// Fontes:
// - Preços de unhas: docs/referencias/tabela-precos-unhas.jpg
// - Preços de tranças: docs/referencias/tabela-precos-trancas.jpg
// - Depilação (R$ 80,00, 1 h): informado pelo usuário.
// - Durações informadas: Manicure, Pedicure, Manicure + Pedicure, Depilação.
// - Demais durações: ESTIMATIVA autorizada pelo usuário (durationEstimated: true),
//   a revisar pelas profissionais no painel admin.

export const seedProfessionals: Professional[] = [
  { id: "stefani", name: "Stéfani Longo Bucco", active: true },
  { id: "lorrayne", name: "Lorrayne Longobuco", active: true },
  { id: "michele", name: "Michele Batista", active: true },
];

export const seedCategories: Category[] = [
  { id: "unhas", name: "Unhas", note: "Francesinha: valor à parte. Encapsular: + R$ 15,00.", sortOrder: 1 },
  { id: "trancas", name: "Tranças", note: "Valores somente de mão de obra.", sortOrder: 2 },
  { id: "depilacao", name: "Depilação", note: null, sortOrder: 3 },
];

type Row = [
  id: string,
  categoryId: string,
  subcategory: string | null,
  name: string,
  priceReais: number,
  durationMin: number,
  estimated: boolean,
  professionalId: string,
];

const rows: Row[] = [
  ["manicure", "unhas", "Cuidados básicos", "Manicure", 20, 30, false, "stefani"],
  ["pedicure", "unhas", "Cuidados básicos", "Pedicure", 25, 30, false, "stefani"],
  ["manicure-pedicure", "unhas", "Cuidados básicos", "Manicure + Pedicure", 40, 60, false, "stefani"],
  ["esmaltacao-gel", "unhas", "Esmaltação e tratamento", "Esmaltação em gel", 50, 60, true, "stefani"],
  ["blindagem", "unhas", "Esmaltação e tratamento", "Blindagem", 40, 60, true, "stefani"],
  ["banho-gel", "unhas", "Esmaltação e tratamento", "Banho de gel", 85, 90, true, "stefani"],
  ["postica-realista", "unhas", "Extensão e decoração", "Postiça realista", 70, 60, true, "stefani"],
  ["molde-f1", "unhas", "Extensão e decoração", "Colocação molde F1", 90, 120, true, "stefani"],
  ["gel-tip", "unhas", "Extensão e decoração", "Gel na tip", 115, 120, true, "stefani"],
  ["fibra-vidro", "unhas", "Extensão e decoração", "Fibra de vidro", 135, 150, true, "stefani"],
  ["manutencao-gel", "unhas", "Manutenções", "Manutenção gel", 85, 90, true, "stefani"],
  ["manutencao-fibra", "unhas", "Manutenções", "Manutenção fibra de vidro", 110, 120, true, "stefani"],
  ["nago-1-3", "trancas", "Tranças nagô", "1 a 3 tranças", 35, 60, true, "lorrayne"],
  ["nago-4-6", "trancas", "Tranças nagô", "4 a 6 tranças", 45, 90, true, "lorrayne"],
  ["nago-7-12", "trancas", "Tranças nagô", "7 a 12 tranças", 60, 120, true, "lorrayne"],
  ["box-braids", "trancas", "Estilos", "Box braids", 190, 360, true, "lorrayne"],
  ["boxeadora", "trancas", "Estilos", "Boxeadora", 140, 180, true, "lorrayne"],
  ["goddess-braids", "trancas", "Estilos", "Goddess braids", 200, 420, true, "lorrayne"],
  ["fulani-braids", "trancas", "Estilos", "Fulani braids", 160, 300, true, "lorrayne"],
  ["ghana-braids", "trancas", "Estilos", "Ghana braids", 160, 240, true, "lorrayne"],
  ["depilacao", "depilacao", null, "Depilação", 80, 60, false, "michele"],
];

export const seedServices: Service[] = rows.map(
  ([id, categoryId, subcategory, name, price, durationMin, estimated, professionalId], i) => ({
    id,
    categoryId,
    subcategory,
    name,
    priceCents: Math.round(price * 100),
    durationMin,
    durationEstimated: estimated,
    professionalId,
    active: true,
    sortOrder: i + 1,
  }),
);
