// Historial de partidos finalizados (auditoría) agrupado por torneo > jornada.
// Solo para admin/supervisor. Solo lectura; sirve los datos mínimos para la vista de auditoría.
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET() {
  try {
    await requireRole(["admin", "supervisor"]);
    const torneos = await prisma.torneo.findMany({
      where: { estado: { in: ["ACTIVO", "FINALIZADO"] } },
      select: {
        id: true,
        nombre: true,
        temporada: true,
        jornadas: {
          select: {
            id: true,
            numero: true,
            nombre: true,
            partidos: {
              where: { estado: "FINALIZADO" },
              select: {
                id: true,
                inicio: true,
                equipoLocal: { select: { nombre: true } },
                equipoVisitante: { select: { nombre: true } },
                acta: { select: { operadorNombre: true, operadorApellido: true, arbitroNombre: true, arbitroApellido: true } },
              },
              orderBy: { inicio: "asc" },
            },
          },
          orderBy: { numero: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(torneos);
  } catch (error) {
    return apiError(error);
  }
}
