// Catálogo de árbitros: eliminación protegida (permiso gestionar_catalogos).
import { apiError } from "@/lib/api";
import { requirePermission } from "@/lib/rbac";
import { eliminarPersona } from "@/lib/personas";

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("gestionar_catalogos");
    const { id } = await context.params;
    await eliminarPersona("arbitro", id);
    return new Response(null, { status: 204 });
  } catch (error) { return apiError(error); }
}