// Fase 5+: consulta pública en tiempo real (sin autenticación) para la página de campeonato.
import { getPublicChampionship } from "@/data/public";

export async function GET(request: Request) {
  const torneoId = new URL(request.url).searchParams.get("torneoId") ?? undefined;
  return Response.json(await getPublicChampionship(torneoId));
}
