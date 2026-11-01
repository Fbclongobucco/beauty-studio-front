import { connection } from "next/server";
import type { ServicesResponse } from "@/lib/domain/types";
import { json } from "@/lib/server/http";
import { repo } from "@/lib/server/repository";

export async function GET() {
  await connection(); // dados em memória mudam a cada requisição
  const [categories, services, professionals] = await Promise.all([
    repo.listCategories(),
    repo.listServices(),
    repo.listProfessionals(),
  ]);
  const profName = new Map(professionals.map((p) => [p.id, p.name]));
  const body: ServicesResponse = {
    categories: categories
      .map((c) => ({
        id: c.id,
        name: c.name,
        note: c.note,
        services: services
          .filter((s) => s.active && s.categoryId === c.id)
          .map((s) => ({
            id: s.id,
            name: s.name,
            subcategory: s.subcategory,
            durationMin: s.durationMin,
            priceCents: s.priceCents,
            professional: { id: s.professionalId, name: profName.get(s.professionalId) ?? "" },
          })),
      }))
      .filter((c) => c.services.length > 0),
  };
  return json(body);
}
