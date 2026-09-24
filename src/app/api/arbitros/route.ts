// Catálogo de árbitros: listado protegido (permiso consultar).
import { apiError } from "@/lib/api";
import { requirePermission } from "@/lib/rbac";
import { listarPersonas } from "@/lib/personas";

export async function GET() {
  try {
    await requirePermission("consultar");
    return Response.json(await listarPersonas("arbitro"));
  } catch (error) { return apiError(error); }
}