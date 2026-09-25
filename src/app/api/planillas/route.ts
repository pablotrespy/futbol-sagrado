import { randomUUID } from "node:crypto";
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { tipoPlanillaSchema } from "@/schemas/planilla";

const MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const MAX_XLSX_BYTES = 10 * 1024 * 1024;

type PlanillaRow = { id: string; tipo: string; nombreArchivo: string; tipoMime: string; updatedAt: Date };

const CAMPOS = { id: true, tipo: true, nombreArchivo: true, tipoMime: true, updatedAt: true } as const;

function esExcel(archivo: File) {
  const tipo = archivo.type || "";
  const nombre = archivo.name.toLowerCase();
  return tipo.includes("spreadsheet") || /\.xlsx?$/.test(nombre);
}

export async function GET() {
  try {
    await requirePermission("gestionar_catalogos");
    const items = await prisma.formatoPlanilla.findMany({ select: CAMPOS, orderBy: { createdAt: "asc" } });
    return Response.json(items satisfies PlanillaRow[]);
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    await requirePermission("gestionar_catalogos");
    const form = await request.formData();
    const tipoField = form.get("tipo");
    if (typeof tipoField !== "string" || !tipoField) throw new Error("CONFLICT:Selecciona el tipo de planilla.");
    const tipo = tipoPlanillaSchema.parse(tipoField);
    const archivo = form.get("archivo");
    if (!(archivo instanceof File) || archivo.size === 0) throw new Error("CONFLICT:Adjunta la planilla Excel.");
    if (archivo.size > MAX_XLSX_BYTES) throw new Error("CONFLICT:El archivo supera el tamaño máximo de 10 MB.");
    if (!esExcel(archivo)) throw new Error("CONFLICT:El archivo debe ser Excel (.xlsx o .xls).");
    const contenido = Buffer.from(await archivo.arrayBuffer());

    const existente = await prisma.formatoPlanilla.findUnique({ where: { tipo } });
    const id = existente?.id ?? randomUUID();
    const guardado = await prisma.formatoPlanilla.upsert({
      where: { tipo },
      create: { id, tipo, nombreArchivo: archivo.name, tipoMime: MIME_XLSX, archivoPath: `${id}.xlsx`, contenido },
      update: { nombreArchivo: archivo.name, tipoMime: MIME_XLSX, archivoPath: `${id}.xlsx`, contenido },
      select: CAMPOS,
    });
    return Response.json(guardado satisfies PlanillaRow, { status: existente ? 200 : 201 });
  } catch (error) { return apiError(error); }
}
