import { Metadata } from "next";
import { connection } from "next/server";
import { getPublicTorneos } from "@/data/public";
import { TorneoSelector } from "@/components/public/torneo-selector";
import { SancionesManager } from "@/components/admin/sanciones-manager";

export const metadata: Metadata = { title: "Amonestados – Padres Plus 50" };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await connection();
  const params = await searchParams;
  const data = await getPublicTorneos(params.torneo);

  return (
    <>
      <section className="mx-auto max-w-7xl px-3 pt-2 pb-0 sm:px-4">
        <div className="flex items-center justify-end gap-3">
          <TorneoSelector tournaments={data.tournaments} selectedId={data.selected?.id ?? ""} basePath="/campeonato/amonestaciones" />
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-3 pt-1 pb-4 sm:px-4">
        {!data.selected ? (
          <p className="mt-10 rounded-2xl bg-white p-8 text-center">Aun no hay torneos publicos.</p>
        ) : (
          <div className="rounded-2xl border-t-4 border-red-300 bg-white px-3 py-5 shadow-sm sm:px-4">
            <h2 className="mb-4 text-base font-black">Amonestados</h2>
            <SancionesManager readOnly publicApi torneoId={data.selected.id} />
          </div>
        )}
      </section>
    </>
  );
}