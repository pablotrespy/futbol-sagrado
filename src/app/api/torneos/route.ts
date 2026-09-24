// Fase 2 / módulo 3: creación y consulta protegida de torneos.
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { torneoSchema } from "@/schemas/programacion";

type TorneoConPartidos = { id: string; tienePartidos: boolean };

export async function GET() {
  try {
    await requirePermission("consultar");
    const [torneos, conPartidos] = await Promise.all([
      prisma.torneo.findMany({ include: { _count: { select: { jornadas: true } } }, orderBy: { createdAt: "desc" } }),
      prisma.jornada.findMany({ where: { partidos: { some: {} } }, select: { torneoId: true }, distinct: ["torneoId"] }),
    ]);
    const conPartidosSet = new Set(conPartidos.map((j) => j.torneoId));
    return Response.json(torneos.map((torneo) => ({ ...torneo, tienePartidos: conPartidosSet.has(torneo.id) } satisfies TorneoConPartidos & typeof torneo)));
  } catch (error) { return apiError(error); }
}
export async function POST(request: Request) { try { await requirePermission("crear_torneo"); const data = torneoSchema.parse(await request.json()); return Response.json(await prisma.torneo.create({ data }), { status: 201 }); } catch (error) { return apiError(error); } }
