// Fase 1 / módulo 11: alta y listado de usuarios. El primer usuario (admin) se
// crea sin sesión cuando la base está vacía (exigiendo ADMIN_SETUP_TOKEN); el
// resto exige gestionar_roles.
import { createHash, timingSafeEqual } from "node:crypto";
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { canAssignRole } from "@/lib/access-policy";
import { auth } from "@/lib/auth";
import { crearUsuarioSchema } from "@/schemas/usuario";
import { normalizarUsuario, primerNombreDe, generarClave } from "@/lib/usuarios";

function tokenSetupValido(recibido: string, esperado: string) {
  const a = createHash("sha256").update(recibido).digest();
  const b = createHash("sha256").update(esperado).digest();
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET() {
  try {
    await requirePermission("gestionar_roles");
    return Response.json(await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, torneoId: true, torneo: { select: { nombre: true } }, createdAt: true }, orderBy: { name: "asc" } }));
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const body = crearUsuarioSchema.parse(await request.json());
    const total = await prisma.user.count();

    if (total > 0) {
      const session = await requirePermission("gestionar_roles");
      if (!canAssignRole(String(session.user.role), body.rol, session.user.id, "")) throw new Error("FORBIDDEN");
    } else {
      if (body.rol !== "admin") throw new Error("FORBIDDEN");
      const setupEsperado = process.env.ADMIN_SETUP_TOKEN;
      const setupRecibido = request.headers.get("x-admin-setup-token") ?? "";
      if (!setupEsperado || !tokenSetupValido(setupRecibido, setupEsperado)) throw new Error("FORBIDDEN");
    }

    const correo = body.correo.toLowerCase();
    if (await prisma.user.findUnique({ where: { email: correo } })) throw new Error("CONFLICT:Ya existe un usuario con ese correo");
    if (await prisma.user.findUnique({ where: { documento: body.documento } })) throw new Error("CONFLICT:Ese documento ya está registrado");
    if (body.rol === "delegado" && !body.torneoId) throw new Error("BAD_REQUEST:Los delegados deben tener un torneo asignado");
    if (body.torneoId && body.rol !== "delegado") throw new Error("BAD_REQUEST:El torneo solo se asigna a delegados");
    if (body.torneoId && !(await prisma.torneo.findUnique({ where: { id: body.torneoId } }))) throw new Error("NOT_FOUND");

    const primerNombre = primerNombreDe(body.nombreCompleto);
    const base = normalizarUsuario(primerNombre);
    let usuario = base;
    for (let i = 1; await prisma.user.findUnique({ where: { username: usuario } }); i++) {
      usuario = `${base}${i}`;
    }

    const clave = generarClave();
    const ctx = await auth.$context;
    const hash = await ctx.password.hash(clave);
    const creado = await ctx.internalAdapter.createUser(
      {
        email: correo,
        name: body.nombreCompleto,
        role: body.rol,
        username: usuario,
        displayUsername: primerNombre,
        documento: body.documento,
        telefono: body.telefono,
        torneoId: body.torneoId,
        emailVerified: false,
      },
      { method: "email-password" },
    );
    await ctx.internalAdapter.linkAccount({ userId: creado.id, providerId: "credential", issuer: "local:credential", accountId: creado.id, password: hash });

    return Response.json({ ok: true, usuario, clave, rol: body.rol }, { status: 201 });
  } catch (error) { return apiError(error); }
}
