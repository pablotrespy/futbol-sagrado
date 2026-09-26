// Descarga pública del PDF de un comunicado (solo lectura).
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const comunicado = await prisma.comunicado.findUnique({ where: { id } });
    if (!comunicado) throw new Error("NOT_FOUND");
    const buffer = comunicado.contenido ? Buffer.from(comunicado.contenido) : null;
    if (!buffer) throw new Error("NOT_FOUND");
    // Los encabezados HTTP no aceptan todos los caracteres Unicode del nombre
    // original (por ejemplo, el guion largo). Usamos un nombre ASCII seguro
    // para evitar que Vercel responda 500 al abrir el PDF.
    const nombre = comunicado.nombreArchivo
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w.\-]+/g, "_");
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": comunicado.tipoMime || "application/pdf",
        "Content-Disposition": `inline; filename="${nombre}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) { return apiError(error); }
}
