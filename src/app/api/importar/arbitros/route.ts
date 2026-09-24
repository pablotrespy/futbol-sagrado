// Importación de árbitros desde Excel: sin confirmar devuelve la vista previa;
// al confirmar crea los nuevos y reactiva coincidencias inactivas.
import { apiError } from "@/lib/api";
import { requirePermission } from "@/lib/rbac";
import { importarPersonas } from "@/lib/personas";

export async function POST(request: Request) {
  try {
    await requirePermission("gestionar_catalogos");
    return await importarPersonas(request, "arbitro");
  } catch (error) { return apiError(error); }
}