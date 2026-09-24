// Fase 5+: vista pública del campeonato con marcador en vivo (polling cada 10 s).
"use client";
import { useEffect, useState } from "react";
import { faseDePartido, formatoReloj } from "@/lib/reloj";
import { TorneoSelector } from "./torneo-selector";
import { ProgramacionJornadas, ModalPartido, type JornadaCartelera } from "./cartelera";
import type { PartidoCartelera } from "./cartelera";

type Goal = { equipoId: string; minuto: number; jugador: { id: string; nombres: string; apellidos: string } };
type Card = { id: string; tipo: string; minuto: number; jugador: { id: string; nombres: string; apellidos: string } };
type Match = {
  id: string;
  inicio: string | Date;
  inicioEfectivo: string | Date | null;
  estado: string;
  equipoLocal: { id: string; nombre: string };
  equipoVisitante: { id: string; nombre: string };
  cancha: { nombre: string } | null;
  acta: { goles: Goal[]; tarjetas: Card[] } | null;
};
type Jornada = { id: string; numero: number; nombre: string; fecha: string | Date | null; estado: string; partidos: Match[] };
type TableRow = {
  id: string;
  jugados: number;
  ganados: number;
  empatados: number;
  perdidos: number;
  golesFavor: number;
  golesContra: number;
  puntos: number;
  puntosFairPlay: number;
  equipo: { id: string; nombre: string };
};
type Scorer = { id: string; goles: number; jugador: { id: string; nombres: string; apellidos: string; equipo: { nombre: string } } };
type Sanction = {
  id: string;
  motivo: string;
  indefinida: boolean;
  duracionFechas: number | null;
  jornadaInicioNumero: number;
  jugador: { nombres: string; apellidos: string; equipo: { nombre: string } };
};
type Chronicle = { id: string; titulo: string; texto: string; publicadaAt: string | Date | null; partido: { equipoLocal: { nombre: string }; equipoVisitante: { nombre: string } } };
export type ChampionshipData = {
  tournaments: { id: string; nombre: string; temporada: string }[];
  selected: { id: string; nombre: string } | null;
  jornadas: Jornada[];
  tabla: TableRow[];
  goleadores: Scorer[];
  sanciones: Sanction[];
  cronicas: Chronicle[];
};

const POLL_MS = 10000;

const mismoDia = (a: string | Date, b: Date) => {
  const f = new Date(a);
  return f.getFullYear() === b.getFullYear() && f.getMonth() === b.getMonth() && f.getDate() === b.getDate();
};

const paginaInicialPorDefecto = (jornadas: Jornada[], ahora: Date) => {
  const conJuegoHoy = jornadas.findIndex((j) => j.partidos.some((p) => p.estado !== "FINALIZADO" && mismoDia(p.inicio, ahora)));
  if (conJuegoHoy !== -1) return conJuegoHoy;
  const conPendientes = jornadas.findIndex((j) => j.partidos.some((p) => p.estado !== "FINALIZADO"));
  if (conPendientes !== -1) return conPendientes;
  for (let i = jornadas.length - 1; i >= 0; i--) {
    if (jornadas[i].partidos.some((p) => p.estado === "FINALIZADO")) return i;
  }
  return 0;
};

const generarPaginas = (actual: number, total: number) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i);
  const ultima = total - 1;
  const candidatos = new Set<number>([0, actual - 1, actual, actual + 1, ultima]);
  const lista = [...candidatos].filter((n) => n >= 0 && n < total).sort((a, b) => a - b);
  const resultado: number[] = [];
  let prev = -2;
  for (const n of lista) {
    if (n - prev > 1) resultado.push(-1);
    resultado.push(n);
    prev = n;
  }
  return resultado;
};

const goalsOf = (p: Match, side: "local" | "visitante") =>
  p.acta?.goles.filter((g) => g.equipoId === (side === "local" ? p.equipoLocal.id : p.equipoVisitante.id)) ?? [];

const scorersOf = (goals: Goal[]) => {
  const map = new Map<string, { nombre: string; minutos: number[] }>();
  for (const g of goals) {
    const entry = map.get(g.jugador.id);
    if (entry) entry.minutos.push(g.minuto);
    else map.set(g.jugador.id, { nombre: `${g.jugador.nombres} ${g.jugador.apellidos}`, minutos: [g.minuto] });
  }
  return Array.from(map.values()).map((s) => `${s.nombre} ${s.minutos.map((m) => `${m}'`).join(" ")}`).join(", ");
};

const MIN_PUBLICO = 80 * 60;
const fasePublica = (p: Match, ahora: Date): ReturnType<typeof faseDePartido> => {
  if (p.estado === "FINALIZADO") return { fase: "FINALIZADO", etiqueta: "FIN", segundos: null };
  const base = faseDePartido(p, ahora);
  if (base.fase === "FINALIZADO") {
    return { fase: "SEGUNDO_TIEMPO", etiqueta: "EN JUEGO", segundos: MIN_PUBLICO };
  }
  return base;
};

const agruparPorDia = (partidos: Match[]) => {
  const grupos = new Map<string, { fecha: Date; partidos: Match[] }>();
  for (const p of partidos) {
    const fecha = new Date(p.inicio);
    const clave = `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;
    const grupo = grupos.get(clave) ?? { fecha, partidos: [] };
    grupo.partidos.push(p);
    grupos.set(clave, grupo);
  }
  return Array.from(grupos.values()).sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
};

const formatoDia = (f: Date) => {
  const s = f.toLocaleDateString("es-CO", { weekday: "long", day: "2-digit", month: "2-digit" });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const formatoHora = (f: string | Date) => new Date(f).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false });

const colorTarjeta = (tipo: string) => (tipo === "ROJA" ? "bg-red-600" : tipo === "AZUL" ? "bg-blue-500" : "bg-yellow-400");

const esManana = (f: Date, ahora: Date) => {
  const hoy = new Date(ahora);
  hoy.setHours(0, 0, 0, 0);
  const dia = new Date(f);
  dia.setHours(0, 0, 0, 0);
  return Math.round((dia.getTime() - hoy.getTime()) / 86400000) === 1;
};

const abrevDia = (f: Date) => {
  const s = f.toLocaleDateString("es-CO", { weekday: "short" });
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/\.$/, "");
};

const aPartidoCartelera = (p: Match, ahora: Date): PartidoCartelera => {
  const inicio = new Date(p.inicio);
  const finalizado = p.estado === "FINALIZADO";
  const reloj = fasePublica(p, ahora);
  const enVivo = !finalizado && reloj.fase !== "PREVIO";
  const marcador = finalizado || enVivo;
  const hora = inicio.getHours() !== 0 || inicio.getMinutes() !== 0 ? inicio.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : null;
  return {
    id: p.id,
    estado: p.estado,
    enVivo,
    enEntretiempo: enVivo && reloj.fase === "ENTRETIEMPO",
    reloj: enVivo ? formatoReloj(reloj.segundos ?? 0) : undefined,
    local: p.equipoLocal.nombre,
    visitante: p.equipoVisitante.nombre,
    golesLocal: marcador ? goalsOf(p, "local").length : undefined,
    golesVisitante: marcador ? goalsOf(p, "visitante").length : undefined,
    dia: esManana(inicio, ahora) ? "Mañana" : abrevDia(inicio),
    fecha: `${inicio.getDate()}/${inicio.getMonth() + 1}`,
    hora: finalizado ? null : hora,
    detalle: {
      cancha: p.cancha?.nombre ?? "",
      hora: finalizado ? null : hora,
      goleadoresLocal: finalizado && goalsOf(p, "local").length > 0 ? scorersOf(goalsOf(p, "local")) : undefined,
      goleadoresVisitante: finalizado && goalsOf(p, "visitante").length > 0 ? scorersOf(goalsOf(p, "visitante")) : undefined,
      tarjetas: (p.acta?.tarjetas ?? []).map((t) => ({ id: t.id, tipo: t.tipo, jugador: `${t.jugador.nombres} ${t.jugador.apellidos}`, minuto: t.minuto })),
    },
  };
};

const aCartelera = (j: Jornada, totalJornadas: number, ahora: Date): JornadaCartelera => ({
  numero: j.numero,
  totalJornadas,
  nombre: j.nombre,
  partidos: j.partidos.map((p) => aPartidoCartelera(p, ahora)),
});

const ScoreBadge = ({ p, ahora }: { p: Match; ahora: Date }) => {
  const reloj = fasePublica(p, ahora);
  const score = `${goalsOf(p, "local").length} – ${goalsOf(p, "visitante").length}`;
  if (reloj.fase === "PREVIO") {
    return <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-[11px] font-normal text-stone-500">{new Date(p.inicio).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</span>;
  }
  if (reloj.fase === "FINALIZADO") {
    return (
      <>
        <span className="rounded-lg bg-stone-200 px-1.5 py-0.5 font-serif text-[10px] font-normal text-stone-500">Fin</span>
        <span className="rounded-lg bg-stone-100 px-3 py-1 font-normal">{score}</span>
      </>
    );
  }
  if (reloj.fase === "ENTRETIEMPO") {
    return (
      <>
        <span className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-2 py-1 text-[11px] font-black text-stone-900">
          ⏸ {formatoReloj(reloj.segundos ?? 0)}
        </span>
        <span className="rounded-lg bg-stone-100 px-3 py-1 font-black">{score}</span>
      </>
    );
  }
  return (
    <>
      <span className="rounded-lg bg-stone-900 px-2 py-1 text-[11px] font-normal text-white">{formatoReloj(reloj.segundos ?? 0)}</span>
      <span className="rounded-lg bg-red-700 px-2.5 py-1 text-[11px] font-normal text-white">{score}</span>
    </>
  );
};

const EstadoJornadaBadge = ({ estado }: { estado: string }) => {
  if (estado === "SUSPENDIDO") return <span className="rounded-lg bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">Suspendido por definir</span>;
  if (estado === "CANCELADO") return <span className="rounded-lg bg-stone-200 px-3 py-1 text-xs font-black text-stone-500">Cancelado</span>;
  return null;
};

// Mensaje de estado por partido: los finalizados/en curso nunca llevan mensaje.
const estadoMensaje = (j: Jornada, p: Match): "SUSPENDIDO" | "CANCELADO" | null => {
  if (p.estado === "FINALIZADO" || p.estado === "EN_CURSO") return null;
  if (p.estado === "SUSPENDIDO") return "SUSPENDIDO";
  if (p.estado === "CANCELADO") return "CANCELADO";
  if (j.estado === "SUSPENDIDA") return "SUSPENDIDO";
  if (j.estado === "CANCELADA") return "CANCELADO";
  return null;
};

const JornadaBloque = ({ j, primero, ahora, totalJornadas }: { j: Jornada; primero: boolean; ahora: Date; totalJornadas: number }) => {
  const grupos = agruparPorDia(j.partidos);
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());
  const [modalPartido, setModalPartido] = useState<Match | null>(null);
  const cartelera = aCartelera(j, totalJornadas, ahora);
  return (
    <div className={primero ? "" : "border-t-4 border-stone-500 pt-4"}>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-red-800 md:hidden">{j.nombre}</h3>
      <div className="md:hidden">
      {grupos.map((grupo) => (
        <div key={grupo.fecha.toISOString()} className="mb-3">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-stone-500">{formatoDia(grupo.fecha)}</p>
          <div className="grid gap-0">
            {grupo.partidos.map((p, idx) => {
              const fase = fasePublica(p, ahora).fase;
              const msj = estadoMensaje(j, p);
              const abierto = abiertos.has(p.id);
              const toggle = () => {
                if (p.estado === "FINALIZADO") {
                  setModalPartido(p);
                  return;
                }
                setAbiertos((prev) => {
                  const next = new Set(prev);
                  if (next.has(p.id)) next.delete(p.id);
                  else next.add(p.id);
                  return next;
                });
              };
              return (
                <article key={p.id} className={`border-b border-stone-200 py-3 text-sm ${idx % 2 === 0 ? "bg-sky-100" : "bg-white"}`}>
                  <button
                    type="button"
                    aria-haspopup={p.estado === "FINALIZADO" ? "dialog" : undefined}
                    aria-expanded={abierto}
                    onClick={toggle}
                    className="flex w-full items-center gap-x-1 text-left sm:gap-x-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-xs">{p.equipoLocal.nombre}</span>
                    <span className="flex shrink-0 flex-wrap items-center justify-center gap-1">
                      {msj ? <EstadoJornadaBadge estado={msj} /> : <ScoreBadge p={p} ahora={ahora} />}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-right text-xs">{p.equipoVisitante.nombre}</span>
                  </button>
                  {p.estado !== "FINALIZADO" && abierto && (
                    <div className="mt-1 space-y-1 border-t border-stone-300/60 px-1 pt-2 text-xs text-stone-500">
                      <p>{formatoHora(p.inicio)}{p.cancha?.nombre ? ` · ${p.cancha.nombre}` : ""}</p>
                      {!msj && fase !== "PREVIO" && (goalsOf(p, "local").length > 0 || goalsOf(p, "visitante").length > 0) && (
                        <div className="grid gap-0.5">
                          {goalsOf(p, "local").length > 0 && (
                            <p><span className="font-semibold text-stone-600">{p.equipoLocal.nombre}:</span> {scorersOf(goalsOf(p, "local"))}</p>
                          )}
                          {goalsOf(p, "visitante").length > 0 && (
                            <p><span className="font-semibold text-stone-600">{p.equipoVisitante.nombre}:</span> {scorersOf(goalsOf(p, "visitante"))}</p>
                          )}
                        </div>
                      )}
                      {!msj && p.acta && p.acta.tarjetas.length > 0 && (
                        <div className="grid gap-0.5">
                          <p className="pt-1 text-[10px] font-bold uppercase tracking-wide text-stone-400">Tarjetas</p>
                          {p.acta.tarjetas.map((t) => (
                            <p key={t.id} className="flex flex-wrap items-center gap-1.5">
                              <span className={`inline-block size-2.5 rounded-full ${colorTarjeta(t.tipo)}`} aria-hidden />
                              {t.jugador.nombres} {t.jugador.apellidos} · {t.minuto}&apos;
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      ))}
      </div>
      <div className="hidden md:block">
        <ProgramacionJornadas jornadas={[cartelera]} />
      </div>
      {modalPartido && (
        <ModalPartido partido={aPartidoCartelera(modalPartido, ahora)} onClose={() => setModalPartido(null)} />
      )}
    </div>
  );
};

export function ChampionshipView({ initial }: { initial: ChampionshipData }) {
  const [data, setData] = useState(initial);
  const [torneoId] = useState(initial.selected?.id ?? "");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [ahora, setAhora] = useState(() => new Date());
  const [pagina, setPagina] = useState(() => paginaInicialPorDefecto(initial.jornadas, new Date()));

  useEffect(() => {
    const timer = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/public/campeonato${torneoId ? `?torneoId=${torneoId}` : ""}`, { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as ChampionshipData;
        if (!cancelled) {
          setData(json);
          setUpdatedAt(new Date());
        }
      } catch {}
    };
    void load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [torneoId]);

  const live = data.jornadas.flatMap((j) => j.partidos.filter((p) => p.estado !== "SUSPENDIDO" && p.estado !== "CANCELADO" && fasePublica(p, ahora).fase !== "PREVIO" && fasePublica(p, ahora).fase !== "FINALIZADO"));
  const totalPaginas = data.jornadas.length;
  const paginaActual = Math.min(pagina, Math.max(totalPaginas - 1, 0));
  const jornadaActual = data.jornadas[paginaActual];
  const totalJornadas = data.jornadas.reduce((max, j) => Math.max(max, j.numero), 0);

  return (
    <main>
      <section className="mx-auto max-w-7xl px-3 py-3 sm:px-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-stone-500">
            {live.length > 0 && (
              <span className="mr-2 inline-flex items-center gap-1 rounded-full bg-red-700 px-2 py-0.5 font-bold text-white">
                <span className="size-1.5 animate-pulse rounded-full bg-amber-300" aria-hidden />
                {live.length} en juego
              </span>
            )}
            {updatedAt ? `Actualizado ${updatedAt.toLocaleTimeString("es-CO")}` : "Se actualiza automáticamente"}
          </p>
          <div className="flex items-center justify-end gap-3">
            <TorneoSelector tournaments={data.tournaments} selectedId={torneoId} basePath="/campeonato" />
          </div>
        </div>

        {!data.selected ? (
          <p className="mt-10 rounded-2xl bg-white p-8 text-center">Aún no hay torneos públicos.</p>
        ) : (
          <div className="mt-8 grid gap-6">

            <section className="rounded-2xl border-t-4 border-red-300 bg-white px-3 py-5 shadow-sm sm:px-4">
              <h2 className="mb-4 hidden text-base font-black sm:block">Calendario y resultados</h2>
              {jornadaActual && (
                <>
                  <JornadaBloque j={jornadaActual} primero ahora={ahora} totalJornadas={totalJornadas} />
                  {totalPaginas > 1 && (
                    <div className="mt-4 flex flex-nowrap items-center justify-center gap-1 border-t border-stone-200 pt-3 sm:gap-1.5 sm:pt-4">
                      <button type="button" disabled={paginaActual === 0} onClick={() => setPagina((p) => Math.max(p - 1, 0))} className="flex items-center justify-center rounded-lg border border-stone-300 bg-white px-2 py-1 text-[11px] font-bold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40 sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm">
                        <span className="sm:hidden" aria-hidden>‹</span>
                        <span className="hidden sm:inline">Anterior</span>
                      </button>
                      {generarPaginas(paginaActual, totalPaginas).map((p, idx) =>
                        p === -1 ? (
                          <span key={`elp-${idx}`} className="px-0.5 text-[11px] text-stone-400 sm:px-1 sm:text-sm">…</span>
                        ) : (
                          <button key={p} type="button" aria-current={p === paginaActual ? "page" : undefined} onClick={() => setPagina(p)} className={p === paginaActual ? "rounded-lg bg-red-700 px-1.5 py-1 text-[11px] font-bold text-white sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm" : "rounded-lg border border-stone-300 bg-white px-1.5 py-1 text-[11px] font-bold text-stone-600 transition hover:bg-stone-50 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"}>
                            {p + 1}
                          </button>
                        ),
                      )}
                      <button type="button" disabled={paginaActual >= totalPaginas - 1} onClick={() => setPagina((p) => Math.min(p + 1, totalPaginas - 1))} className="flex items-center justify-center rounded-lg border border-stone-300 bg-white px-2 py-1 text-[11px] font-bold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40 sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm">
                        <span className="sm:hidden" aria-hidden>›</span>
                        <span className="hidden sm:inline">Siguiente</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>

            {data.cronicas.length > 0 && (
              <section className="rounded-2xl border-t-4 border-red-300 bg-white px-3 py-5 shadow-sm sm:px-4">
                <h2 className="mb-4 text-base font-black">Últimas crónicas</h2>
                <div className="grid gap-3">
                  {data.cronicas.map((c) => (
                    <article key={c.id} className="rounded-xl border p-4 text-sm">
                      <h3 className="font-bold">{c.titulo}</h3>
                      <p className="mt-1 text-xs text-stone-500">{c.partido.equipoLocal.nombre} vs {c.partido.equipoVisitante.nombre} · {new Date(c.publicadaAt ?? "").toLocaleDateString("es-CO")}</p>
                      <p className="mt-2 line-clamp-3 text-stone-600">{c.texto}</p>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
