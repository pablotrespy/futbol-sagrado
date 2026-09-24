// Comunicados del torneo: listado y carga de PDFs emitidos (admin/supervisor).
import { randomUUID } from "node:crypto";
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { comunicadoSchema } from "@/schemas/comunicado";
import { guardarPdf, MAX_PDF_BYTES } from "@/lib/almacen";

type ComunicadoRow = { id: string; resolucion: string; fecha: Date; nombreArchivo: string; tipoMime: string; updatedAt: Date };

const CAMPOS = { id: true, resolucion: true, fecha: true, nombreArchivo: true, tipoMime: true, updatedAt: true } as const;

async function extraerArchivo(form: FormData) {
  const archivo = form.get("archivo");
  if (!(archivo instanceof File)) throw new Error("CONFLICT:Adjunta el PDF del comunicado.");
  if (archivo.size === 0) throw new Error("CONFLICT:El archivo está vacío.");
  if (archivo.size > MAX_PDF_BYTES) throw new Error("CONFLICT:El PDF supera el tamaño máximo de 10 MB.");
  const tipo = archivo.type || "application/pdf";
  if (tipo !== "application/pdf" && !archivo.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("CONFLICT:El archivo debe ser un PDF.");
  }
  return { buffer: Buffer.from(await archivo.arrayBuffer()), nombre: archivo.name, tipo };
}

export async function GET(request: Request) {
  try {
    await requirePermission("gestionar_comunicados");
    const torneoId = new URL(request.url).searchParams.get("torneoId");
    const items = await prisma.comunicado.findMany({
      where: torneoId ? { torneoId } : undefined,
      select: CAMPOS,
      orderBy: { fecha: "desc" },
    });
    return Response.json(items satisfies ComunicadoRow[]);
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    await requirePermission("gestionar_comunicados");
    const form = await request.formData();
    const torneoId = form.get("torneoId");
    if (typeof torneoId !== "string" || !torneoId) throw new Error("CONFLICT:Selecciona el torneo.");
    const data = comunicadoSchema.parse({
      resolucion: form.get("resolucion"),
      fecha: form.get("fecha"),
    });
    const { buffer, nombre, tipo } = await extraerArchivo(form);

    const id = randomUUID();
    const creado = await prisma.comunicado.create({
      data: {
        id,
        torneoId,
        resolucion: data.resolucion,
        fecha: data.fecha,
        nombreArchivo: nombre,
        tipoMime: tipo,
        archivoPath: `${id}.pdf`,
      },
      select: CAMPOS,
    });
    await guardarPdf(id, buffer);
    return Response.json(creado satisfies ComunicadoRow, { status: 201 });
  } catch (error) { return apiError(error); }
}