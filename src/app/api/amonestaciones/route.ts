import { apiError } from "@/lib/api";
import { requireAnyPermission, hasPermission } from "@/lib/rbac";
import { getAmonestacionesItems } from "@/lib/amonestaciones";

export async function GET(request: Request) {
  try {
    const session = await requireAnyPermission("operar_mesa", "gestionar_amonestaciones", "ver_planilla_montos");
    const showMontos = hasPermission(String(session.user.role), "ver_planilla_montos");
    const torneoId = new URL(request.url).searchParams.get("torneoId") ?? undefined;
    const items = await getAmonestacionesItems({ torneoId, showMontos });
    return Response.json(items);
  } catch (e) {
    return apiError(e);
  }
}