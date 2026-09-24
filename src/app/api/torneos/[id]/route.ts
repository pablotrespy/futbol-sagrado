// Fase 2 / módulo 3: editar y activar/desactivar un torneo (solo admin).
import { z } from "zod";
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

const editarTorneoSchema = z.object({
  nombre: z.string().trim().min(3).max(100).optional(),
  temporada: z.string().trim().min(2).max(30).optional(),
  estado: z.enum(["ACTIVO", "BORRADOR", "CANCELADO"]).optional(),
}).refine((value) => Object.values(value).some((campo) => campo !== undefined), { message: "Sin cambios para guardar" });

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("crear_torneo");
    const { id } = await context.params;
    const data = editarTorneoSchema.parse(await request.json());
    if (data.estado === "CANCELADO") {
      const conPartidos = await prisma.jornada.count({ where: { torneoId: id, partidos: { some: {} } } });
      if (conPartidos > 0) throw new Error("CONFLICT:Solo se puede cancelar un torneo sin partidos.");
    }
    return Response.json(await prisma.torneo.update({ where: { id }, data, select: { id: true, nombre: true, temporada: true, estado: true } }));
  } catch (error) { return apiError(error); }
}
