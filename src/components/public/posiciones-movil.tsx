// Vista móvil de la tabla de posiciones: tarjeta por equipo con Pts y últimos 3 resultados; detalles en modal.
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

export type Forma = "G" | "E" | "P";

export function FormaBadge({ resultado }: { resultado: Forma }) {
  const label = resultado === "G" ? "Ganado" : resultado === "E" ? "Empate" : "Perdido";
  const clase = resultado === "G" ? "bg-emerald-500" : resultado === "E" ? "bg-gray-400" : "bg-red-500";
  return (
    <span title={label} aria-label={label} className={`inline-grid size-4 place-items-center rounded-full text-[10px] font-black text-white ${clase}`}>
      {resultado === "G" ? "✓" : resultado === "E" ? "—" : "✕"}
    </span>
  );
}

export function FormaFila({ resultados, take = 5 }: { resultados: Forma[]; take?: number }) {
  return resultados.length > 0 ? (
    <div className="flex justify-center gap-1">
      {resultados.slice(-take).map((r, i) => (
        <FormaBadge key={i} resultado={r} />
      ))}
    </div>
  ) : null;
}

export type PartidoHistorial = {
  jornada: number;
  inicio: string;
  local: string;
  visitante: string;
  equipoLocalId: string;
  equipoVisitanteId: string;
  golesLocal: number;
  golesVisitante: number;
};

export type FilaPosicion = {
  id: string;
  puntos: number;
  jugados: number;
  ganados: number;
  empatados: number;
  perdidos: number;
  golesFavor: number;
  golesContra: number;
  equipo: { id: string; nombre: string };
  resultados: Forma[];
  historial: PartidoHistorial[];
};

function ModalPosicion({ fila, indice, onClose }: { fila: FilaPosicion; indice: number; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const dg = fila.golesFavor - fila.golesContra;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`${fila.equipo.nombre} – estadísticas`}>
      <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-stone-900/50" />
      <div className="relative z-10 w-full max-w-md max-h-[85vh] overflow-hidden overflow-y-auto rounded-2xl border-t-4 border-red-300 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <p className="min-w-0 font-black leading-tight text-stone-900">
            <span className="mr-1 text-stone-400">{indice + 1}.</span>
            <Link href={`/equipos/${fila.equipo.id}`} className="sm:hidden break-words hover:underline">
              {fila.equipo.nombre}
            </Link>
            <span className="hidden sm:inline break-words">{fila.equipo.nombre}</span>
          </p>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="shrink-0 rounded-lg border border-stone-200 px-2 py-1 text-stone-500 transition hover:bg-stone-50">
            <X className="size-4" />
          </button>
        </div>
        <div className="mx-5 mt-4 rounded-xl bg-stone-50 px-3 py-4">
          <dl className="grid grid-cols-7 gap-1 text-center text-xs">
            <div className="min-w-0"><dt className="text-stone-400">PJ</dt><dd className="font-semibold">{fila.jugados}</dd></div>
            <div className="min-w-0"><dt className="text-stone-400">G</dt><dd className="font-semibold">{fila.ganados}</dd></div>
            <div className="min-w-0"><dt className="text-stone-400">E</dt><dd className="font-semibold">{fila.empatados}</dd></div>
            <div className="min-w-0"><dt className="text-stone-400">P</dt><dd className="font-semibold">{fila.perdidos}</dd></div>
            <div className="min-w-0"><dt className="text-stone-400">GF</dt><dd className="font-semibold">{fila.golesFavor}</dd></div>
            <div className="min-w-0"><dt className="text-stone-400">GC</dt><dd className="font-semibold">{fila.golesContra}</dd></div>
            <div className="min-w-0 rounded-lg bg-stone-100"><dt className="text-stone-400">DG</dt><dd className="font-black">{dg}</dd></div>
          </dl>
        </div>
        <div className="mx-5 mt-4 pb-5">
          <h3 className="text-xs font-black text-stone-500">Partidos jugados</h3>
          {fila.historial.length === 0 ? (
            <p className="mt-2 text-xs text-stone-400">Aún no ha jugado partidos.</p>
          ) : (
            <ul className="mt-2 max-h-48 divide-y divide-stone-200 overflow-y-auto rounded-xl border border-stone-200">
              {fila.historial.map((p, i) => {
                const esLocal = p.equipoLocalId === fila.equipo.id;
                const golesEquipo = esLocal ? p.golesLocal : p.golesVisitante;
                const golesRival = esLocal ? p.golesVisitante : p.golesLocal;
                const color = golesEquipo > golesRival ? "text-emerald-600" : golesEquipo < golesRival ? "text-red-600" : "text-stone-500";
                return (
                  <li key={i} className={`flex items-center gap-2 px-3 py-1.5 text-xs ${color}`}>
                    <span className="shrink-0 text-stone-400">J{p.jornada}</span>
                    <span className="min-w-0 flex-1 truncate">
                      <span className={esLocal ? "font-bold" : ""}>{p.local}</span>
                      <span className="text-stone-400"> vs </span>
                      <span className={esLocal ? "" : "font-bold"}>{p.visitante}</span>
                    </span>
                    <span className="shrink-0 font-bold tabular-nums">{p.golesLocal} - {p.golesVisitante}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function CardPosicionesMovil({ rows }: { rows: FilaPosicion[] }) {
  const [abierto, setAbierto] = useState<FilaPosicion | null>(null);

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 sm:hidden">
      <div className="divide-y divide-stone-200">
        {rows.map((row, i) => {
          const ultimos = row.resultados.slice(-3);
          const offset = 3 - ultimos.length;
          return (
            <button key={row.id} type="button" aria-haspopup="dialog" onClick={() => setAbierto(row)} className="flex w-full items-center gap-1 px-2 py-1 text-left">
              <p className="min-w-0 text-[11px] font-normal leading-tight">
                <span className="mr-1 text-stone-400">{i + 1}.</span>
                <span className="break-words">{row.equipo.nombre}</span>
              </p>
              <span className="ml-auto flex shrink-0 items-center gap-1.5">
                <span className="w-14 shrink-0 whitespace-nowrap text-right text-[11px] font-semibold text-red-700">{row.puntos} Pts</span>
                <span className="flex shrink-0 items-center justify-end gap-1.5">
                  {[0, 1, 2].map((slot) => {
                    const r = slot >= offset ? ultimos[slot - offset] : undefined;
                    return r ? <FormaBadge key={slot} resultado={r} /> : <span key={slot} className="size-4" aria-hidden="true" />;
                  })}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {abierto && <ModalPosicion fila={abierto} indice={rows.findIndex((r) => r.id === abierto.id)} onClose={() => setAbierto(null)} />}
    </div>
  );
}

export function TablaPosicionesDesktop({ rows }: { rows: FilaPosicion[] }) {
  const [abierto, setAbierto] = useState<FilaPosicion | null>(null);

  return (
    <div className="hidden overflow-x-auto sm:block">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b text-xs text-stone-500">
            <th className="pb-2 pr-2">Equipo</th>
            <th className="pb-2 px-2 text-center font-black">Pts</th>
            <th className="pb-2 px-2 text-center">PJ</th>
            <th className="pb-2 px-2 text-center">G</th>
            <th className="pb-2 px-2 text-center">E</th>
            <th className="pb-2 px-2 text-center">P</th>
            <th className="pb-2 px-2 text-center">GF</th>
            <th className="pb-2 px-2 text-center">GC</th>
            <th className="pb-2 px-2 text-center">DG</th>
            <th className="pb-2 pl-2 text-center">Últimos 5</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id} onClick={() => setAbierto(row)} className={`cursor-pointer border-b last:border-0 transition hover:bg-sky-100 ${i % 2 === 0 ? "bg-sky-50" : ""}`}>
              <td className="py-2 pr-2 font-bold">
                <span className="mr-1 text-stone-400">{i + 1}.</span>
                <span>{row.equipo.nombre}</span>
              </td>
              <td className="py-2 px-2 text-center font-black">{row.puntos}</td>
              <td className="py-2 px-2 text-center">{row.jugados}</td>
              <td className="py-2 px-2 text-center">{row.ganados}</td>
              <td className="py-2 px-2 text-center">{row.empatados}</td>
              <td className="py-2 px-2 text-center">{row.perdidos}</td>
              <td className="py-2 px-2 text-center">{row.golesFavor}</td>
              <td className="py-2 px-2 text-center">{row.golesContra}</td>
              <td className="py-2 px-2 text-center">{row.golesFavor - row.golesContra}</td>
              <td className="py-2 pl-2"><FormaFila resultados={row.resultados} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {abierto && <ModalPosicion fila={abierto} indice={rows.findIndex((r) => r.id === abierto.id)} onClose={() => setAbierto(null)} />}
    </div>
  );
}