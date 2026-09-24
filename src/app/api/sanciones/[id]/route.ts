import { apiError } from "@/lib/api"; import { prisma } from "@/lib/prisma"; import { requirePermission } from "@/lib/rbac"; import { sancionSchema } from "@/schemas/sancion"; import { calcularSancion } from "@/lib/reglamento";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("gestionar_amonestaciones");
    const { id } = await context.params;
    const data = sancionSchema.parse(await request.json());
    const reg = data.tarjeta ? calcularSancion(data.tarjeta) : null;
    return Response.json(await prisma.sancion.update({
      where: { id },
      data: {
        jugadorId: data.jugadorId,
        torneoId: data.torneoId,
        partidoId: data.partidoId ?? null,
        motivo: data.motivo,
        tarjeta: data.tarjeta ?? null,
        jornadaInicioNumero: data.jornadaInicioNumero,
        duracionFechas: reg ? reg.duracionFechas : (data.duracionFechas ?? null),
        indefinida: reg ? reg.indefinida : data.indefinida,
        valorPagar: reg ? reg.multa : (data.valorPagar ?? 0),
        estadoPago: data.estadoPago ?? "PENDIENTE",
      },
    }));
  } catch (e) { return apiError(e); }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("gestionar_amonestaciones");
    const { id } = await context.params;
    const body = await request.json();
    const allowed: Record<string, unknown> = {};
    if (body.estado !== undefined) allowed.estado = body.estado;
    if (body.estadoPago !== undefined) allowed.estadoPago = body.estadoPago;
    if (Object.keys(allowed).length === 0) throw new Error("Sin cambios");
    return Response.json(await prisma.sancion.update({ where: { id }, data: allowed }));
  } catch (e) { return apiError(e); }
}