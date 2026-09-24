import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { eliminarPlanilla } from "@/lib/almacen";

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("gestionar_catalogos");
    const { id } = await context.params;
    const existente = await prisma.formatoPlanilla.findUnique({ where: { id } });
    if (!existente) throw new Error("NOT_FOUND");
    await prisma.formatoPlanilla.delete({ where: { id } });
    await eliminarPlanilla(id);
    return new Response(null, { status: 204 });
  } catch (error) { return apiError(error); }
}
