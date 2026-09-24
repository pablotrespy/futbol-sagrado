// Recuperación de clave · paso 2: validar código y fijar nueva clave.
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { recoveryConfirmSchema } from "@/schemas/usuario";
import { checkLimit, requestIp, resetLimit } from "@/lib/rate-limit";

const MAX_INTENTOS_POR_CODIGO = 5;
const VENTANA_CODIGO_MS = 15 * 60 * 1000;
const MAX_POR_IP = 120;
const VENTANA_IP_MS = 60 * 1000;
const MAX_POR_TEL = 60;
const VENTANA_TEL_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const body = recoveryConfirmSchema.parse(await request.json());
    const ip = requestIp(request);

    if (!checkLimit(`recovery-confirm-ip:${ip}`, MAX_POR_IP, VENTANA_IP_MS).ok) {
      return Response.json({ error: "Demasiados intentos. Intenta de nuevo en unos minutos." }, { status: 429 });
    }
    if (!checkLimit(`recovery-confirm-tel:${body.telefono}`, MAX_POR_TEL, VENTANA_TEL_MS).ok) {
      return Response.json({ error: "Demasiados intentos. Intenta de nuevo en unos minutos." }, { status: 429 });
    }

    const usuario = await prisma.user.findFirst({ where: { telefono: body.telefono } });
    const token = usuario
      ? await prisma.passwordResetToken.findFirst({ where: { userId: usuario.id, usado: false, codigo: body.codigo } })
      : null;

    const intentoKey = `recovery-intento:${token?.id ?? "desconocido"}`;
    const intentos = checkLimit(intentoKey, MAX_INTENTOS_POR_CODIGO, VENTANA_CODIGO_MS);
    if (!intentos.ok) {
      if (token) await prisma.passwordResetToken.update({ where: { id: token.id }, data: { usado: true } });
      return Response.json({ error: "Demasiados intentos con este código. Solicita uno nuevo." }, { status: 429 });
    }

    if (!usuario || !token || token.expiresAt < new Date()) {
      return Response.json({ error: "Código inválido o expirado" }, { status: 400 });
    }

    const ctx = await auth.$context;
    await ctx.internalAdapter.updatePassword(usuario.id, await ctx.password.hash(body.nuevaClave));
    await prisma.passwordResetToken.update({ where: { id: token.id }, data: { usado: true } });
    resetLimit(intentoKey);
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}