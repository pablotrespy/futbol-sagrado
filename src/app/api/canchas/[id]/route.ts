// Fase 1 / módulo 1: edición y eliminación protegida de canchas.
import { canchaSchema } from "@/schemas/cancha";
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("gestionar_catalogos");
    const { id } = await context.params;
    const data = canchaSchema.parse(await request.json());
    return Response.json(await prisma.cancha.update({ where: { id }, data: { ...data, ubicacion: data.ubicacion || null, descripcion: data.descripcion || null } }));
  } catch (error) { return apiError(error); }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("gestionar_catalogos");
    const { id } = await context.params;
    await prisma.cancha.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error) { return apiError(error); }
}
