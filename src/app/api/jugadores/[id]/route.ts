// Fase 1 / módulo 2: edición y eliminación protegida de jugadores.
import { jugadorSchema } from "@/schemas/jugador";
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("gestionar_catalogos");
    const { id } = await context.params;
    const data = jugadorSchema.parse(await request.json());
    return Response.json(await prisma.jugador.update({ where: { id }, data: { ...data, documento: data.documento || null, fechaNacimiento: data.fechaNacimiento ? new Date(`${data.fechaNacimiento}T00:00:00.000Z`) : null, posicion: data.posicion || null } }));
  } catch (error) { return apiError(error); }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("gestionar_catalogos");
    const { id } = await context.params;
    await prisma.jugador.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error) { return apiError(error); }
}
