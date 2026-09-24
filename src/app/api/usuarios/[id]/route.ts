// Asignar/cambiar el torneo (campeonato) de un delegado existente.
// El rol se asigna al crear el acceso y NO se modifica aquí; solo cambia torneoId.
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { canAssignRole } from "@/lib/access-policy";
import { asignarTorneoDelegadoSchema } from "@/schemas/usuario";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission("gestionar_roles");
    const { id } = await context.params;
    const { torneoId } = asignarTorneoDelegadoSchema.parse(await request.json());

    const usuario = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!usuario) throw new Error("NOT_FOUND");
    if (usuario.role !== "delegado") throw new Error("BAD_REQUEST:El torneo solo se asigna a delegados");
    if (!canAssignRole(String(session.user.role), "delegado", session.user.id, usuario.id)) throw new Error("FORBIDDEN");
    if (torneoId && !(await prisma.torneo.findUnique({ where: { id: torneoId } }))) throw new Error("NOT_FOUND");

    const actualizado = await prisma.user.update({
      where: { id },
      data: { torneoId },
      select: { id: true, name: true, email: true, role: true, torneoId: true, torneo: { select: { nombre: true } }, createdAt: true },
    });
    return Response.json(actualizado);
  } catch (error) { return apiError(error); }
}