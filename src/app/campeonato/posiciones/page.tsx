import { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { getPublicPosiciones } from "@/data/public";
import { TorneoSelector } from "@/components/public/torneo-selector";
import { CardPosicionesMovil, TablaPosicionesDesktop } from "@/components/public/posiciones-movil";

export const metadata: Metadata = { title: "Posiciones – Padres Plus 50" };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await connection();
  const params = await searchParams;
  const data = await getPublicPosiciones(params.torneo);
  const rows = data.selected
    ? data.tabla.map((row) => ({
        ...row,
        resultados: data.forma[row.equipo.id] ?? [],
        historial: data.historial[row.equipo.id] ?? [],
      }))
    : [];

  return (
    <>
      <section className="mx-auto max-w-7xl px-3 pt-2 pb-0 sm:px-4">
        <div className="flex items-center justify-end gap-3">
          <TorneoSelector tournaments={data.tournaments} selectedId={data.selected?.id ?? ""} basePath="/campeonato/posiciones" />
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-3 pt-0 pb-2 sm:px-4 sm:pt-1 sm:pb-4">
        {!data.selected ? (
          <p className="mt-10 rounded-2xl bg-white p-8 text-center">Aún no hay torneos públicos.</p>
        ) : (
          <div className="grid gap-6">
            <div className="rounded-2xl border-t-4 border-red-300 bg-white px-3 py-2 shadow-sm sm:px-4 sm:py-5">
              <h2 className="mb-2 text-base font-black sm:mb-4">Tabla de posiciones</h2>
              {rows.length === 0 ? (
                <p className="text-sm text-stone-400">No hay datos de posiciones aún.</p>
              ) : (
                <>
                  <CardPosicionesMovil rows={rows} />
                  <TablaPosicionesDesktop rows={rows} />
                </>
              )}
            </div>

            <div className="rounded-2xl border-t-4 border-red-300 bg-white px-3 py-5 shadow-sm sm:px-4">
              <h2 className="mb-4 text-base font-black">Goleadores</h2>
              {data.goleadores.length === 0 ? (
                <p className="text-sm text-stone-400">Aún no hay goleadores registrados.</p>
              ) : (
                <div className="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200">
                  {data.goleadores.map((g, i) => (
                    <Link key={g.id} href={`/jugadores/${g.jugador.id}`} className="flex w-full items-center gap-2 px-3 py-2 text-left">
                      <span className="min-w-0 flex-1 text-xs font-normal leading-tight">
                        <span className="mr-2 text-stone-400">{i + 1}.</span>
                        {g.jugador.nombres} {g.jugador.apellidos}
                        <span className="ml-2 text-stone-600">({g.jugador.equipo.nombre})</span>
                      </span>
                      <span className="whitespace-nowrap text-right text-xs font-semibold text-red-700">{g.goles} ⚽</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
