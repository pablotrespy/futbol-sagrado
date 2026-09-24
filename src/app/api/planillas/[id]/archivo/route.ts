import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { leerPlanilla } from "@/lib/almacen";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("gestionar_catalogos");
    const { id } = await context.params;
    const planilla = await prisma.formatoPlanilla.findUnique({ where: { id } });
    if (!planilla) throw new Error("NOT_FOUND");
    const buffer = await leerPlanilla(id);
    if (!buffer) throw new Error("NOT_FOUND");
    const nombre = planilla.nombreArchivo.replace(/[^\w.\-\u00C0-\uFFFF]+/g, "_");
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": planilla.tipoMime || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${nombre}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) { return apiError(error); }
}
