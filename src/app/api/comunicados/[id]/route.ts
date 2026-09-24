// Comunicados: edición (resolución/fecha y PDF opcional) y eliminación.
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { comunicadoSchema } from "@/schemas/comunicado";
import { eliminarPdf, guardarPdf } from "@/lib/almacen";

const CAMPOS = { id: true, resolucion: true, fecha: true, nombreArchivo: true, tipoMime: true, updatedAt: true } as const;

async function archivoOpcional(form: FormData) {
  const archivo = form.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) return null;
  const tipo = archivo.type || "application/pdf";
  if (tipo !== "application/pdf" && !archivo.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("CONFLICT:El archivo debe ser un PDF.");
  }
  return { buffer: Buffer.from(await archivo.arrayBuffer()), nombre: archivo.name, tipo };
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("gestionar_comunicados");
    const { id } = await context.params;
    const form = await request.formData();
    const data = comunicadoSchema.parse({
      resolucion: form.get("resolucion"),
      fecha: form.get("fecha"),
    });
    const archivo = await archivoOpcional(form);

    const existente = await prisma.comunicado.findUnique({ where: { id } });
    if (!existente) throw new Error("NOT_FOUND");

    const actualizado = await prisma.comunicado.update({
      where: { id },
      data: {
        resolucion: data.resolucion,
        fecha: data.fecha,
        ...(archivo ? { nombreArchivo: archivo.nombre, tipoMime: archivo.tipo } : {}),
      },
      select: CAMPOS,
    });
    if (archivo) await guardarPdf(id, archivo.buffer);
    return Response.json(actualizado);
  } catch (error) { return apiError(error); }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("gestionar_comunicados");
    const { id } = await context.params;
    await prisma.comunicado.delete({ where: { id } });
    await eliminarPdf(id);
    return new Response(null, { status: 204 });
  } catch (error) { return apiError(error); }
}