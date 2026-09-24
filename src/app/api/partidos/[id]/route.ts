// Fase 2 / módulo 4: edición y eliminación de partidos.
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { validateSchedule } from "@/lib/programacion";
import { requirePermission } from "@/lib/rbac";
import { actualizarPartidoSchema } from "@/schemas/programacion";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("programar");
    const { id } = await context.params;
    const data = actualizarPartidoSchema.parse(await request.json());
    const current = await prisma.partido.findUnique({ where: { id } });
    if (!current) throw new Error("NOT_FOUND");
    if (current.estado === "FINALIZADO") throw new Error("CONFLICT:Un partido finalizado no puede modificarse.");
    const candidate = { ...data, inicio: new Date(data.inicio), operadorId: data.operadorId || null, arbitroId: data.arbitroId || null };
    const [existing, teamCount, courtCount, operadorOk, arbitroOk] = await Promise.all([
      prisma.partido.findMany({ where: { id: { not: id }, estado: { not: "CANCELADO" } }, select: { jornadaId: true, equipoLocalId: true, equipoVisitanteId: true, canchaId: true, inicio: true, duracionMinutos: true } }),
      prisma.equipo.count({ where: { id: { in: [data.equipoLocalId, data.equipoVisitanteId] }, activo: true } }),
      prisma.cancha.count({ where: { id: data.canchaId, activa: true } }),
      data.operadorId ? prisma.operador.count({ where: { id: data.operadorId, activo: true } }) : Promise.resolve(1),
      data.arbitroId ? prisma.arbitro.count({ where: { id: data.arbitroId, activo: true } }) : Promise.resolve(1),
    ]);
    if (teamCount !== 2 || courtCount !== 1) throw new Error("CONFLICT:Hay equipos o canchas inexistentes/inactivos.");
    if (operadorOk !== 1 || arbitroOk !== 1) throw new Error("CONFLICT:El operador de mesa o el árbitro asignado no existe o está inactivo.");
    if (existing.filter((match) => match.jornadaId === current.jornadaId).some((match) => [match.equipoLocalId, match.equipoVisitanteId].includes(data.equipoLocalId) || [match.equipoLocalId, match.equipoVisitanteId].includes(data.equipoVisitanteId))) throw new Error("CONFLICT:Uno de los equipos ya tiene partido en esta jornada.");
    const conflicts = validateSchedule([candidate], existing);
    if (conflicts.length) throw new Error(`CONFLICT:${conflicts.join(" ")}`);
    return Response.json(await prisma.partido.update({ where: { id }, data: candidate }));
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("programar");
    const { id } = await context.params;
    const current = await prisma.partido.findUnique({ where: { id } });
    if (!current) throw new Error("NOT_FOUND");
    await prisma.partido.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
