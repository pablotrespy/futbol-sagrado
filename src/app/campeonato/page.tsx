// Fase 5: calendario, resultados, posiciones, goleadores y sanciones públicas (en vivo).
import { connection } from "next/server";
import { ChampionshipView } from "@/components/public/championship-view";
import { getPublicChampionship } from "@/data/public";

export default async function CampeonatoPage({
  searchParams,
}: {
  searchParams: Promise<{ torneo?: string }>;
}) {
  await connection();
  const query = await searchParams;
  const data = await getPublicChampionship(query.torneo);
  return <ChampionshipView key={data.selected?.id ?? "vacio"} initial={data} />;
}
