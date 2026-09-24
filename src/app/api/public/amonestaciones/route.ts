// Consulta pública de amonestaciones (sin autenticación): mismo formato que la planilla de delegados, sin montos.
import { apiError } from "@/lib/api";
import { getAmonestacionesItems } from "@/lib/amonestaciones";

export async function GET(request: Request) {
  try {
    const torneoId = new URL(request.url).searchParams.get("torneoId") ?? undefined;
    const items = await getAmonestacionesItems({ torneoId, showMontos: false });
    return Response.json(items);
  } catch (e) {
    return apiError(e);
  }
}