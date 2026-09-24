// Recuperación de clave · paso 1: solicitar código por teléfono (mock).
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { recoveryRequestSchema } from "@/schemas/usuario";
import { checkLimit, requestIp } from "@/lib/rate-limit";

const VENTANA_IP_MS = 60 * 1000;
const MAX_POR_IP = 10;
const VENTANA_TEL_MS = 15 * 60 * 1000;
const MAX_POR_TEL = 3;

export async function POST(request: Request) {
  try {
    const { telefono } = recoveryRequestSchema.parse(await request.json());
    const ip = requestIp(request);

    if (!checkLimit(`recovery-request-ip:${ip}`, MAX_POR_IP, VENTANA_IP_MS).ok) {
      return Response.json({ error: "Demasiadas solicitudes. Intenta de nuevo en unos minutos." }, { status: 429 });
    }
    if (!checkLimit(`recovery-request-tel:${telefono}`, MAX_POR_TEL, VENTANA_TEL_MS).ok) {
      return Response.json({ error: "Ya solicitaste un código para este teléfono. Reintenta en 15 minutos." }, { status: 429 });
    }

    const usuario = await prisma.user.findFirst({ where: { telefono } });
    if (usuario) {
      const codigo = String(Math.floor(100000 + Math.random() * 900000));
      await prisma.passwordResetToken.deleteMany({ where: { userId: usuario.id, usado: false } });
      await prisma.passwordResetToken.create({
        data: { userId: usuario.id, codigo, expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
      });
    }
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}