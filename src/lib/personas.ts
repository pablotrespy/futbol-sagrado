// Catálogos de personas (operadores de mesa y árbitros): importación Excel con
// dos fases (analizar → confirmar) y acceso compartido por las rutas de API.
import { apiError } from "@/lib/api";
import { analizarPersonas, extraerFilasPersonas } from "@/lib/importar";
import { prisma } from "@/lib/prisma";

export type ModeloPersona = "arbitro" | "operador";
export type PersonaRegistro = { id: string; nombres: string; apellidos: string; activo: boolean };

type ColeccionPersonas = {
  findMany: (args: { orderBy: Array<{ apellidos?: "asc" | "desc"; nombres?: "asc" | "desc" }> }) => Promise<PersonaRegistro[]>;
  create: (args: { data: { nombres: string; apellidos: string; activo: boolean } }) => Promise<unknown>;
  update: (args: { where: { id: string }; data: { nombres: string; apellidos: string; activo: boolean } }) => Promise<unknown>;
  delete: (args: { where: { id: string } }) => Promise<unknown>;
};

const coleccionDe = (modelo: ModeloPersona): ColeccionPersonas =>
  (modelo === "arbitro" ? prisma.arbitro : prisma.operador) as unknown as ColeccionPersonas;

export async function listarPersonas(modelo: ModeloPersona): Promise<PersonaRegistro[]> {
  return coleccionDe(modelo).findMany({ orderBy: [{ apellidos: "asc" }, { nombres: "asc" }] });
}

export async function eliminarPersona(modelo: ModeloPersona, id: string): Promise<void> {
  await coleccionDe(modelo).delete({ where: { id } });
}

export async function importarPersonas(request: Request, modelo: ModeloPersona) {
  try {
    const form = await request.formData();
    const archivo = form.get("archivo");
    if (!(archivo instanceof File)) throw new Error("CONFLICT:Adjunta el archivo Excel a importar.");
    const confirmar = new URL(request.url).searchParams.get("confirmar") === "1";
    const filas = extraerFilasPersonas(Buffer.from(await archivo.arrayBuffer()));
    if (filas.length === 0) throw new Error("CONFLICT:El archivo no tiene datos con encabezados Nombres y Apellidos.");
    const existentes = await listarPersonas(modelo);
    const analisis = analizarPersonas(filas, existentes);
    if (!confirmar) return Response.json(analisis);

    let creados = 0;
    let reactivados = 0;
    const porClave = new Map(existentes.map((persona) => [`${persona.nombres} ${persona.apellidos}`.toLocaleLowerCase(), persona]));
    await prisma.$transaction(async (tx) => {
      const coleccion = (modelo === "arbitro" ? tx.arbitro : tx.operador) as unknown as ColeccionPersonas;
      for (const fila of analisis.filas) {
        if (fila.estado === "error" || fila.estado === "duplicado") continue;
        const datos = { nombres: fila.nombres, apellidos: fila.apellidos, activo: true };
        const existente = porClave.get(`${fila.nombres} ${fila.apellidos}`.toLocaleLowerCase());
        if (fila.estado === "existente" && existente) {
          if (!existente.activo) {
            await coleccion.update({ where: { id: existente.id }, data: datos });
            reactivados++;
          }
        } else {
          await coleccion.create({ data: datos });
          creados++;
        }
      }
    });
    return Response.json({ ...analisis, confirmado: true, creados, reactivados });
  } catch (error) {
    return apiError(error);
  }
}