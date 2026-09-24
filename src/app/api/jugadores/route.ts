// Fase 1 / módulo 2: listado y creación protegida de jugadores.
import { jugadorSchema } from "@/schemas/jugador";
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export async function GET() {
  try {
    await requirePermission("consultar");
    return Response.json(await prisma.jugador.findMany({ include: { equipo: { select: { id: true, nombre: true } } }, orderBy: [{ apellidos: "asc" }, { nombres: "asc" }] }));
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    await requirePermission("gestionar_catalogos");
    const data = jugadorSchema.parse(await request.json());
    return Response.json(await prisma.jugador.create({ data: { ...data, documento: data.documento || null, fechaNacimiento: data.fechaNacimiento ? new Date(`${data.fechaNacimiento}T00:00:00.000Z`) : null, posicion: data.posicion || null, vinculo: data.vinculo || null } }), { status: 201 });
  } catch (error) { return apiError(error); }
}
