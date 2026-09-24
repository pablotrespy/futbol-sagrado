// DELETE y PUT para jornadas individuales (nombre, renombre y transiciones de estado).
import { z } from "zod";
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { EstadoJornada, EstadoPartido } from "@/generated/prisma/enums";

const editarJornadaSchema = z.object({
  nombre: z.string().trim().min(2).max(80).optional(),
  fecha: z.union([z.iso.date(), z.iso.datetime({ offset: true })]).optional(),
  estado: z.enum(["NORMAL", "SUSPENDIDA", "CANCELADA"]).optional(),
}).refine((value) => Object.values(value).some((campo) => campo !== undefined), { message: "Sin cambios para guardar" });

const transiciones: Partial<Record<string, Partial<Record<string, boolean>>>> = {
  NORMAL: { SUSPENDIDA: true },
  SUSPENDIDA: { NORMAL: true, CANCELADA: true },
  CANCELADA: { NORMAL: true },
};

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("programar");
    const { id } = await context.params;
    const data = editarJornadaSchema.parse(await request.json());
    const fecha = data.fecha === undefined ? undefined : new Date(data.fecha.length === 10 ? `${data.fecha}T00:00:00-05:00` : data.fecha);
    const actualizada = await prisma.$transaction(async (tx) => {
      if (data.estado !== undefined) {
        const jornada = await tx.jornada.findUnique({ where: { id }, include: { partidos: { select: { id: true, estado: true, acta: { select: { finalizadaAt: true } } } } } });
        if (!jornada) throw new Error("NOT_FOUND");
        if (!transiciones[jornada.estado]?.[data.estado]) throw new Error(`CONFLICT:No se puede cambiar de ${jornada.estado} a ${data.estado}; primero suspende la jornada.`);
        if (data.estado === "CANCELADA" && jornada.partidos.some((p) => p.estado === EstadoPartido.FINALIZADO || (p.estado === EstadoPartido.EN_CURSO && p.acta))) throw new Error("CONFLICT:No se puede cancelar una jornada con partidos finalizados o en juego real (con acta abierta).");
        if (data.estado === "CANCELADA") await tx.partido.updateMany({ where: { jornadaId: id, estado: { not: EstadoPartido.CANCELADO } }, data: { estado: EstadoPartido.CANCELADO } });
        if (data.estado === "NORMAL" && jornada.estado === EstadoJornada.CANCELADA) await tx.partido.updateMany({ where: { jornadaId: id, estado: EstadoPartido.CANCELADO }, data: { estado: EstadoPartido.PROGRAMADO } });
      }
      return tx.jornada.update({
        where: { id },
        data: {
          ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
          ...(fecha !== undefined ? { fecha } : {}),
          ...(data.estado !== undefined ? { estado: data.estado } : {}),
        },
        select: { id: true, torneoId: true, numero: true, nombre: true, fecha: true, estado: true },
      });
    });
    return Response.json(actualizada);
  } catch (error) { return apiError(error); }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("programar");
    const { id } = await params;
    await prisma.jornada.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
