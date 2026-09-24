// Fase 5+: importación de equipos desde planilla Excel (vista previa + confirmación).
// Los equipos ya existentes en el torneo se omiten; solo se crean los nuevos.
import { apiError } from "@/lib/api";
import { analizarEquipos, extraerFilasEquipos } from "@/lib/importar";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export async function POST(request: Request) {
  try {
    await requirePermission("gestionar_catalogos");
    const url = new URL(request.url);
    const form = await request.formData();
    const archivo = form.get("archivo");
    if (!(archivo instanceof File)) throw new Error("CONFLICT:Adjunta el archivo Excel a importar.");
    const torneoId = url.searchParams.get("torneoId");
    if (!torneoId) throw new Error("CONFLICT:Selecciona el torneo al que se importarán los equipos.");
    const confirmar = url.searchParams.get("confirmar") === "1";
    const filas = extraerFilasEquipos(Buffer.from(await archivo.arrayBuffer()));
    const existentes = await prisma.equipo.findMany({ where: { torneoId }, select: { nombre: true } });
    const analisis = analizarEquipos(
      filas,
      existentes.map((equipo) => equipo.nombre),
    );
    if (!confirmar || analisis.nuevos === 0) return Response.json({ ...analisis, creados: 0 });
    const resultado = await prisma.$transaction((tx) =>
      tx.equipo.createMany({
        data: analisis.filas
          .filter((fila) => fila.estado === "nuevo")
          .map((fila) => ({ torneoId, nombre: fila.nombre, color: fila.color || null, activo: true })),
      }),
    );
    return Response.json({ ...analisis, creados: resultado.count });
  } catch (error) {
    return apiError(error);
  }
}
