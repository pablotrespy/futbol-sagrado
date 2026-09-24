// Descarga pública del PDF de un comunicado (solo lectura).
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { leerPdf } from "@/lib/almacen";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const comunicado = await prisma.comunicado.findUnique({ where: { id } });
    if (!comunicado) throw new Error("NOT_FOUND");
    const buffer = await leerPdf(id);
    if (!buffer) throw new Error("NOT_FOUND");
    const nombre = comunicado.nombreArchivo.replace(/[^\w.\-\u00C0-\uFFFF]+/g, "_");
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": comunicado.tipoMime || "application/pdf",
        "Content-Disposition": `inline; filename="${nombre}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) { return apiError(error); }
}