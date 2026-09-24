// Suspensión/reactivación/cancelación individual de un partido (jornada NORMAL).
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAnyPermission } from "@/lib/rbac";
import { cambiarEstadoPartidoSchema } from "@/schemas/programacion";

const transiciones: Record<string, string[]> = {
  PROGRAMADO: ["SUSPENDIDO", "CANCELADO"],
  EN_CURSO: ["SUSPENDIDO", "CANCELADO"],
  SUSPENDIDO: ["EN_CURSO", "PROGRAMADO", "CANCELADO"],
  CANCELADO: ["PROGRAMADO"],
};

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAnyPermission("programar", "operar_mesa");
    const { id } = await context.params;
    const { estado } = cambiarEstadoPartidoSchema.parse(await request.json());
    const partido = await prisma.partido.findUnique({ where: { id }, include: { jornada: { select: { estado: true } } } });
    if (!partido) throw new Error("NOT_FOUND");
    if (partido.jornada.estado !== "NORMAL") throw new Error("CONFLICT:La jornada no está activa; la suspensión se maneja a nivel de jornada.");
    if (partido.estado === "FINALIZADO") throw new Error("CONFLICT:Un partido finalizado no puede cambiar de estado.");
    if (!transiciones[partido.estado]?.includes(estado)) throw new Error("CONFLICT:No se puede cambiar a ese estado desde el estado actual.");
    const actualizado = await prisma.partido.update({ where: { id }, data: { estado }, select: { id: true, estado: true } });
    return Response.json(actualizado);
  } catch (error) {
    return apiError(error);
  }
}