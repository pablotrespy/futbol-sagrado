// Fase 5+: recalibración del reloj del partido desde mesa de control (cambio de estado manual).
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { cambioEstadoSchema } from "@/schemas/reloj";
import { origenVirtual } from "@/lib/reloj";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("operar_mesa");
    const { id } = await context.params;
    const input = cambioEstadoSchema.parse(await request.json());
    const match = await prisma.partido.findUnique({ where: { id }, include: { acta: true, jornada: { select: { estado: true } } } });
    if (!match) throw new Error("NOT_FOUND");
    if (match.jornada.estado !== "NORMAL") throw new Error("CONFLICT:La jornada no está activa; no se puede operar un partido de una jornada suspendida o cancelada.");
    if (match.estado === "FINALIZADO" || match.estado === "CANCELADO" || match.estado === "SUSPENDIDO" || match.acta?.finalizadaAt) {
      throw new Error("CONFLICT:El partido está finalizado; los cambios deben aplicarse antes de finalizar el acta.");
    }
    const inicioEfectivo = input.restaurar || !input.fase ? null : origenVirtual(input.fase, input.minutos ?? 0, new Date());
    await prisma.partido.update({ where: { id }, data: { inicioEfectivo } });
    return Response.json({ aplicado: true, restaurado: input.restaurar === true, inicioEfectivo });
  } catch (error) {
    return apiError(error);
  }
}
