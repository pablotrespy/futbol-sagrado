// Fase 1 / módulo 2: listado y creación protegida de equipos.
import { equipoSchema } from "@/schemas/equipo";
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    await requirePermission("consultar");
    const torneoId = new URL(request.url).searchParams.get("torneoId");
    const where = torneoId ? { torneoId } : {};
    return Response.json(await prisma.equipo.findMany({ where, include: { _count: { select: { jugadores: true } } }, orderBy: { nombre: "asc" } }));
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    await requirePermission("gestionar_catalogos");
    const data = equipoSchema.parse(await request.json());
    return Response.json(await prisma.equipo.create({ data: { ...data, torneoId: data.torneoId, color: data.color || null } }), { status: 201 });
  } catch (error) { return apiError(error); }
}
