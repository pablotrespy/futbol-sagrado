// Fase 1 / módulo 1: listado y creación protegida de canchas.
import { canchaSchema } from "@/schemas/cancha";
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export async function GET() {
  try {
    await requirePermission("consultar");
    return Response.json(await prisma.cancha.findMany({ orderBy: { nombre: "asc" } }));
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    await requirePermission("gestionar_catalogos");
    const data = canchaSchema.parse(await request.json());
    const cancha = await prisma.cancha.create({ data: { ...data, ubicacion: data.ubicacion || null, descripcion: data.descripcion || null } });
    return Response.json(cancha, { status: 201 });
  } catch (error) { return apiError(error); }
}
