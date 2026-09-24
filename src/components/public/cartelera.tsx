// Vista cartelera (desktop): programación de partidos por jornadas con marcadores en finalizados.
"use client";
import { useEffect, useState } from "react";
import { ChevronDown, X } from "lucide-react";

export type DetallePartidoCartelera = {
  cancha?: string;
  hora?: string | null;
  goleadoresLocal?: string;
  goleadoresVisitante?: string;
  tarjetas?: { id: string; tipo: string; jugador: string; minuto: number }[];
};

export type PartidoCartelera = {
  id?: string;
  estado: string;
  enVivo?: boolean;
  enEntretiempo?: boolean;
  reloj?: string;
  local: string;
  visitante: string;
  golesLocal?: number;
  golesVisitante?: number;
  dia: string;
  fecha: string | null;
  hora?: string | null;
  detalle?: DetallePartidoCartelera;
};

export type JornadaCartelera = {
  numero: number;
  totalJornadas: number;
  nombre?: string;
  partidos: PartidoCartelera[];
};

const colorTarjeta = (tipo: string) => (tipo === "ROJA" ? "bg-red-600" : tipo === "AZUL" ? "bg-blue-500" : "bg-yellow-400");

export function PartidoProgramado({ partido }: { partido: PartidoCartelera }) {
  const [abierto, setAbierto] = useState(false);
  const [modal, setModal] = useState(false);
  const finalizado = partido.estado === "FINALIZADO";
  const enVivo = Boolean(partido.enVivo);
  const marcadorVisible = finalizado || enVivo;
  const golesLocal = marcadorVisible ? (partido.golesLocal ?? 0) : null;
  const golesVisitante = marcadorVisible ? (partido.golesVisitante ?? 0) : null;
  const diaFecha = `${partido.dia}${partido.fecha ? `, ${partido.fecha}` : ""}`;

  return (
    <article className="flex flex-col rounded-xl border border-stone-200 bg-white">
      <button
        type="button"
        aria-haspopup={finalizado ? "dialog" : undefined}
        aria-expanded={finalizado ? undefined : abierto}
        aria-controls={finalizado ? undefined : `det-${partido.id}`}
        onClick={() => (finalizado ? setModal(true) : setAbierto((v) => !v))}
        className="flex w-full items-start gap-3 px-4 py-3 text-left sm:gap-4 sm:px-5 sm:py-4"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-stone-900">{partido.local}</p>
          <p className="mt-1 truncate text-xs text-stone-900">{partido.visitante}</p>
        </div>
        <div className="shrink-0 text-right">
          {marcadorVisible ? (
            <>
              <p className="font-normal text-stone-700">{golesLocal}</p>
              <p className="mt-1 font-normal text-stone-700">{golesVisitante}</p>
            </>
          ) : (
            <span aria-hidden className="block w-6" />
          )}
        </div>
        <div className="shrink-0 text-right">
          {finalizado ? (
            <>
              <p className="font-serif text-sm text-stone-500">Fin</p>
              <p className="mt-1 text-sm text-stone-600">{diaFecha}</p>
            </>
          ) : enVivo ? (
            <>
              {partido.enEntretiempo ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-2 py-1 text-[11px] font-black text-stone-900">⏸ {partido.reloj}</span>
              ) : (
                <span className="rounded-lg bg-stone-900 px-2 py-1 text-[11px] font-normal text-white">{partido.reloj}</span>
              )}
              <p className="mt-1 text-sm text-stone-600">{diaFecha}</p>
            </>
          ) : (
            <>
              <p className="text-sm text-stone-600">{diaFecha}</p>
              <p className="mt-1 text-sm text-stone-500">{partido.hora ?? "Por definir"}</p>
            </>
          )}
        </div>
        {!finalizado && (
          <span className={`shrink-0 self-center text-stone-300 transition-transform ${abierto ? "" : "-rotate-90"}`}>
            <ChevronDown className="size-4" />
          </span>
        )}
      </button>
      {!finalizado && abierto && partido.detalle && (
        <div id={`det-${partido.id}`} className="border-t border-stone-100 px-4 py-3 text-xs text-stone-500 sm:px-5 sm:py-4">
          <p>{[partido.detalle.hora ?? "", partido.detalle.cancha ?? ""].filter(Boolean).join(" · ") || "—"}</p>
          {partido.detalle.goleadoresLocal && (
            <p className="mt-1">
              <span className="font-semibold text-stone-600">{partido.local}:</span> {partido.detalle.goleadoresLocal}
            </p>
          )}
          {partido.detalle.goleadoresVisitante && (
            <p className="mt-1">
              <span className="font-semibold text-stone-600">{partido.visitante}:</span> {partido.detalle.goleadoresVisitante}
            </p>
          )}
          {partido.detalle.tarjetas && partido.detalle.tarjetas.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Tarjetas</p>
              <div className="mt-0.5 grid gap-0.5">
                {partido.detalle.tarjetas.map((t) => (
                  <p key={t.id} className="flex items-center gap-1.5">
                    <span className={`inline-block size-2.5 rounded-full ${colorTarjeta(t.tipo)}`} aria-hidden />
                    {t.jugador} · {t.minuto}&apos;
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {finalizado && modal && <ModalPartido partido={partido} onClose={() => setModal(false)} />}
    </article>
  );
}

export function ModalPartido({ partido, onClose }: { partido: PartidoCartelera; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const golesLocal = partido.golesLocal ?? 0;
  const golesVisitante = partido.golesVisitante ?? 0;
  const diaFecha = `${partido.dia}${partido.fecha ? `, ${partido.fecha}` : ""}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`${partido.local} vs ${partido.visitante}`}>
      <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-stone-900/50" />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border-t-4 border-red-300 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <div>
            <p className="text-lg font-black text-stone-900">
              {partido.local} <span className="font-normal text-stone-400">vs</span> {partido.visitante}
            </p>
            <p className="mt-1 text-sm text-stone-500">{diaFecha}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg border border-stone-200 px-2 py-1 text-stone-500 transition hover:bg-stone-50">
            <X className="size-4" />
          </button>
        </div>
        <div className="mx-5 mt-4 flex items-center justify-center gap-6 rounded-xl bg-stone-50 py-4">
          <span className="text-2xl font-black text-stone-900">{golesLocal}</span>
          <span className="font-serif text-xl text-stone-400">Fin</span>
          <span className="text-2xl font-black text-stone-900">{golesVisitante}</span>
        </div>
        {partido.detalle && (
          <div className="px-5 py-4 text-sm text-stone-600">
            <p>{[partido.detalle.hora ?? "", partido.detalle.cancha ?? ""].filter(Boolean).join(" · ") || "—"}</p>
            {partido.detalle.goleadoresLocal && (
              <p className="mt-2">
                <span className="font-semibold text-stone-800">{partido.local}:</span> {partido.detalle.goleadoresLocal}
              </p>
            )}
            {partido.detalle.goleadoresVisitante && (
              <p className="mt-1">
                <span className="font-semibold text-stone-800">{partido.visitante}:</span> {partido.detalle.goleadoresVisitante}
              </p>
            )}
            {partido.detalle.tarjetas && partido.detalle.tarjetas.length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Tarjetas</p>
                <div className="mt-1 grid gap-1">
                  {partido.detalle.tarjetas.map((t) => (
                    <p key={t.id} className="flex items-center gap-1.5">
                      <span className={`inline-block size-2.5 rounded-full ${colorTarjeta(t.tipo)}`} aria-hidden />
                      {t.jugador} · {t.minuto}&apos;
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

export function JornadaSection({ numero, totalJornadas, nombre, partidos }: JornadaCartelera) {
  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <header className="border-b border-stone-200 bg-stone-50 px-3 py-2.5 sm:px-4">
        <h2 className="text-sm font-bold tracking-wide text-stone-700">
          {nombre ? capitalizar(nombre) : `Jornada ${numero}/${totalJornadas}`}
        </h2>
      </header>
      <div className="grid grid-cols-2 gap-3 p-3 sm:gap-4 sm:p-4">
        {partidos.map((p, idx) => (
          <PartidoProgramado key={p.id ?? idx} partido={p} />
        ))}
      </div>
    </section>
  );
}

export function ProgramacionJornadas({ jornadas }: { jornadas: JornadaCartelera[] }) {
  return (
    <div className="grid gap-4">
      {jornadas.map((j) => (
        <JornadaSection key={j.numero} numero={j.numero} totalJornadas={j.totalJornadas} nombre={j.nombre} partidos={j.partidos} />
      ))}
    </div>
  );
}