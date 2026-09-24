// Fase 6: exportación de plantillas de jugadores a Excel (una hoja por club).
import * as XLSX from "xlsx";
import { apiError } from "@/lib/api";
import { calcularEdad } from "@/lib/edad";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

const limpiarTitulo = (nombre: string): string => nombre.replace(/\\\/\?\*[\]:]/g, " ").replace(/\s+/g, " ").trim().slice(0, 31) || "Equipo";

export async function GET(request: Request) {
  try {
    await requirePermission("gestionar_catalogos");
    const torneoId = new URL(request.url).searchParams.get("torneoId");
    if (!torneoId) throw new Error("CONFLICT:Selecciona el torneo para exportar sus plantillas.");
    const equipos = await prisma.equipo.findMany({
      where: { torneoId, activo: true },
      orderBy: { nombre: "asc" },
      select: {
        nombre: true,
        jugadores: {
          where: { activo: true },
          orderBy: [{ numeroCamiseta: "asc" }, { apellidos: "asc" }],
          select: { nombres: true, apellidos: true, documento: true, fechaNacimiento: true, numeroCamiseta: true, vinculo: true },
        },
      },
    });
    if (equipos.length === 0) throw new Error("CONFLICT:No hay equipos activos para exportar.");
    const libro = XLSX.utils.book_new();
    const usados = new Set<string>();
    for (const equipo of equipos) {
      const base = limpiarTitulo(equipo.nombre);
      let titulo = base;
      let sufijo = 2;
      while (usados.has(titulo.toLocaleLowerCase())) titulo = `${base.slice(0, 29)} ${sufijo++}`;
      usados.add(titulo.toLocaleLowerCase());
      const matriz = [
        ["Nombres", "Apellidos", "Documento", "Fecha nacimiento", "Nº camiseta", "Vínculo", "Edad"],
        ...equipo.jugadores.map((jugador) => [
          jugador.nombres,
          jugador.apellidos,
          jugador.documento ?? "",
          jugador.fechaNacimiento ? jugador.fechaNacimiento.toISOString().slice(0, 10) : "",
          jugador.numeroCamiseta ?? "",
          jugador.vinculo ?? "",
          calcularEdad(jugador.fechaNacimiento) ?? "",
        ]),
      ];
      XLSX.utils.book_append_sheet(libro, XLSX.utils.aoa_to_sheet(matriz), titulo);
    }
    const buffer = XLSX.write(libro, { type: "buffer", bookType: "xlsx" }) as Buffer;
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="plantillas-jugadores.xlsx"',
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
