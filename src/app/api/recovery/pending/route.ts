// Recuperación de clave · listado para admin/supervisor: códigos pendientes (mock).
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export async function GET() {
  try {
    await requirePermission("gestionar_roles");
    const pendientes = await prisma.passwordResetToken.findMany({
      where: { usado: false, expiresAt: { gt: new Date() } },
      include: { user: { select: { name: true, username: true, telefono: true } } },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(pendientes.map((t) => ({ id: t.id, nombre: t.user.name, usuario: t.user.username, telefono: t.user.telefono, codigo: t.codigo, expiresAt: t.expiresAt })));
  } catch (error) { return apiError(error); }
}