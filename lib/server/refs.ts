import { repo } from "./repository";

/** Confere se categoria e profissional referenciados existem. */
export async function checkRefs(categoryId?: string, professionalId?: string) {
  const fields: Record<string, string> = {};
  if (categoryId && !(await repo.listCategories()).some((c) => c.id === categoryId)) fields.categoryId = "Categoria não encontrada.";
  if (professionalId && !(await repo.listProfessionals()).some((p) => p.id === professionalId))
    fields.professionalId = "Profissional não encontrada.";
  return Object.keys(fields).length ? fields : null;
}
