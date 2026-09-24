// Fase 1 / módulo 2: edición y eliminación protegida de equipos.
import { equipoSchema } from "@/schemas/equipo";
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("gestionar_catalogos");
    const { id } = await context.params;
    const data = equipoSchema.parse(await request.json());
    return Response.json(await prisma.equipo.update({ where: { id }, data: { ...data, color: data.color || null } }));
  } catch (error) { return apiError(error); }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("gestionar_catalogos");
    const { id } = await context.params;
    await prisma.equipo.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error) { return apiError(error); }
}
