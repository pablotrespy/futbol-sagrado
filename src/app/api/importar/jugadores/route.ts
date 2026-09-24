// Fase 6: importación de plantillas de jugadores desde Excel.
// Sin confirmar devuelve la vista previa; al confirmar reemplaza cada plantel:
// desactiva los ausentes, reactiva/actualiza coincidencias y crea los nuevos.
import { apiError } from "@/lib/api";
import { analizarJugadores, extraerFilasJugadores } from "@/lib/importar";
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
    if (!torneoId) throw new Error("CONFLICT:Selecciona el torneo al que se importarán las plantillas.");
    const confirmar = url.searchParams.get("confirmar") === "1";
    const hojas = extraerFilasJugadores(Buffer.from(await archivo.arrayBuffer()));
    if (hojas.length === 0) throw new Error("CONFLICT:El archivo no tiene hojas con encabezados de jugadores (Nombres y Apellidos).");
    const [equipos, jugadores] = await Promise.all([
      prisma.equipo.findMany({ where: { torneoId }, select: { id: true, nombre: true } }),
      prisma.jugador.findMany({ where: { equipo: { torneoId } }, select: { id: true, nombres: true, apellidos: true, documento: true, activo: true, equipoId: true } }),
    ]);
    const analisis = analizarJugadores(hojas, equipos, jugadores);
    if (!confirmar) return Response.json(analisis);

    let creados = 0;
    let actualizados = 0;
    let desactivados = 0;
    await prisma.$transaction(async (tx) => {
      const porDocumento = new Map(jugadores.filter((j) => j.documento).map((j) => [j.documento!, j]));
      for (const plantilla of analisis.plantillas) {
        if (!plantilla.equipo) continue;
        const destino = equipos.find((equipo) => equipo.nombre === plantilla.equipo);
        if (!destino) continue;
        const validas = plantilla.filas.filter((fila) => fila.estado === "nuevo" || fila.estado === "actualizado");
        const porNombre = new Map(jugadores.filter((j) => j.equipoId === destino.id).map((j) => [`${j.nombres} ${j.apellidos}`.toLocaleLowerCase(), j]));
        const conservados = new Set<string>();
        for (const fila of validas) {
          const existente = (fila.documento ? porDocumento.get(fila.documento) : undefined) ?? porNombre.get(`${fila.nombres} ${fila.apellidos}`.toLocaleLowerCase());
          const datos = {
            nombres: fila.nombres,
            apellidos: fila.apellidos,
            documento: fila.documento || null,
            fechaNacimiento: fila.fechaNacimiento ? new Date(`${fila.fechaNacimiento}T00:00:00.000Z`) : null,
            numeroCamiseta: fila.numeroCamiseta,
            vinculo: fila.vinculo || null,
            activo: true,
          };
          if (existente) {
            await tx.jugador.update({ where: { id: existente.id }, data: datos });
            conservados.add(existente.id);
            actualizados++;
          } else {
            const creado = await tx.jugador.create({ data: { ...datos, equipoId: destino.id } });
            conservados.add(creado.id);
            porDocumento.set(creado.documento!, creado);
            porNombre.set(`${creado.nombres} ${creado.apellidos}`.toLocaleLowerCase(), creado);
            jugadores.push(creado);
            creados++;
          }
        }
        const ausentes = jugadores.filter((j) => j.equipoId === destino.id && j.activo && !conservados.has(j.id)).map((j) => j.id);
        if (ausentes.length > 0) {
          const resultado = await tx.jugador.updateMany({ where: { id: { in: ausentes } }, data: { activo: false } });
          desactivados += resultado.count;
        }
      }
    });
    return Response.json({ ...analisis, confirmado: true, creados, actualizados, desactivados });
  } catch (error) {
    return apiError(error);
  }
}
