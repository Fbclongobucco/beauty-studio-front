import { validateBooking } from "@/lib/domain/validation";
import { apiError, json, readJson, validationError } from "@/lib/server/http";
import { repo } from "@/lib/server/repository";

export async function POST(request: Request) {
  const parsed = validateBooking(await readJson(request));
  if (!parsed.ok) return validationError(parsed.fields);

  const result = await repo.createAppointment(parsed.value);
  if (!result.ok) {
    if (result.reason === "SERVICE_NOT_FOUND") {
      return validationError({ serviceId: "Esse serviço não está disponível." });
    }
    return apiError(409, "SLOT_UNAVAILABLE", "Esse horário acabou de ser ocupado. Escolha outro.");
  }
  return json(result.appointment, 201);
}
