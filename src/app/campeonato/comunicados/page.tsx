import { Metadata } from "next";
import { FileText } from "lucide-react";
import { connection } from "next/server";
import { getPublicComunicados } from "@/data/public";
import { TorneoSelector } from "@/components/public/torneo-selector";

export const metadata: Metadata = { title: "Comunicados – Padres Plus 50" };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await connection();
  const params = await searchParams;
  const data = await getPublicComunicados(params.torneo);

  return (
    <>
      <section className="mx-auto max-w-7xl px-3 pt-2 pb-0 sm:px-4">
        <div className="flex items-center justify-end gap-3">
          <TorneoSelector tournaments={data.tournaments} selectedId={data.selected?.id ?? ""} basePath="/campeonato/comunicados" />
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-3 pt-1 pb-4 sm:px-4">
        {!data.selected ? (
          <p className="mt-10 rounded-2xl bg-white p-8 text-center">Aun no hay torneos publicos.</p>
        ) : data.comunicados.length === 0 ? (
          <p className="mt-10 rounded-2xl bg-white p-8 text-center text-stone-400">No hay comunicados en este torneo.</p>
        ) : (
          <div className="grid gap-3">
            {data.comunicados.map((c) => (
              <article key={c.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700"><FileText className="size-6" /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold leading-tight">Resolución N° {c.resolucion}</p>
                  <p className="text-sm text-stone-500">{new Date(c.fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" })}</p>
                </div>
                <a href={`/api/comunicados/${c.id}/archivo`} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800">Ver PDF</a>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}