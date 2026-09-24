import { apiError } from "@/lib/api"; import { prisma } from "@/lib/prisma"; import { requirePermission, requireAnyPermission, hasPermission } from "@/lib/rbac"; import { sancionSchema } from "@/schemas/sancion"; import { calcularSancion } from "@/lib/reglamento";

export async function GET(request: Request) {
  try {
    const session = await requireAnyPermission("operar_mesa", "ver_planilla_montos");
    const torneoId = new URL(request.url).searchParams.get("torneoId");
    const sanciones = await prisma.sancion.findMany({
      where: torneoId ? { torneoId } : {},
      include: { jugador: { select: { id: true, nombres: true, apellidos: true, equipo: { select: { nombre: true } } } }, torneo: { select: { id: true, nombre: true } } },
      orderBy: { createdAt: "desc" },
    });
    const showMontos = hasPermission(String(session.user.role), "ver_planilla_montos");
    if (showMontos) return Response.json(sanciones);
    return Response.json(sanciones.map((s) => ({ id: s.id, jugadorId: s.jugadorId, torneoId: s.torneoId, motivo: s.motivo, tarjeta: s.tarjeta, jornadaInicioNumero: s.jornadaInicioNumero, duracionFechas: s.duracionFechas, indefinida: s.indefinida, estado: s.estado, createdAt: s.createdAt, updatedAt: s.updatedAt, jugador: s.jugador, torneo: s.torneo })));
  } catch (e) { return apiError(e); }
}
export async function POST(request: Request) { try { await requirePermission("gestionar_amonestaciones"); const data = sancionSchema.parse(await request.json()); const reg = data.tarjeta ? calcularSancion(data.tarjeta) : null; return Response.json(await prisma.sancion.create({ data: { jugadorId: data.jugadorId, torneoId: data.torneoId, partidoId: data.partidoId ?? null, motivo: data.motivo, tarjeta: data.tarjeta ?? null, jornadaInicioNumero: data.jornadaInicioNumero, duracionFechas: reg ? reg.duracionFechas : (data.duracionFechas ?? null), indefinida: reg ? reg.indefinida : data.indefinida, valorPagar: reg ? reg.multa : (data.valorPagar ?? 0), estadoPago: data.estadoPago ?? "PENDIENTE", estado: "ACTIVA" } }), { status: 201 }); } catch (e) { return apiError(e); } }