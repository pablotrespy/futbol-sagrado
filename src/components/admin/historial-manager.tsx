// Historial de partidos finalizados (auditoría, solo lectura). Solo admin/supervisor.
"use client";
import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { ArrowLeft, History } from "lucide-react";
import { http } from "@/lib/http";
import { Button } from "@/components/ui/button";

type PartidoHist = { id: string; inicio: string; equipoLocal: { nombre: string }; equipoVisitante: { nombre: string }; acta: { operadorNombre: string | null; operadorApellido: string | null; arbitroNombre: string | null; arbitroApellido: string | null } | null };
type JornadaHist = { id: string; numero: number; nombre: string; partidos: PartidoHist[] };
type TorneoHist = { id: string; nombre: string; temporada: string | null; jornadas: JornadaHist[] };

type Jugador = { id: string; nombres: string; apellidos: string; equipoId: string };
type Detalle = {
  id: string;
  estado: string;
  inicio: string;
  equipoLocal: { id: string; nombre: string; jugadores: Jugador[] };
  equipoVisitante: { id: string; nombre: string; jugadores: Jugador[] };
  acta: {
    finalizadaAt: string | null;
    operadorNombre: string | null;
    operadorApellido: string | null;
    arbitroNombre: string | null;
    arbitroApellido: string | null;
    alineaciones: { jugadorId: string; titular: boolean }[];
    goles: { jugadorId: string; equipoId: string; minuto: number; autogol: boolean }[];
    tarjetas: { jugadorId: string; minuto: number; tipo: "AMARILLA" | "AZUL" | "ROJA" }[];
  } | null;
};

const message = (e: unknown) => (e instanceof AxiosError ? String(e.response?.data?.error ?? "No fue posible completar la operación") : "Error inesperado");
const fmtFecha = (iso: string) => new Date(iso).toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const nom = (p: { nombres: string; apellidos: string }) => `${p.nombres} ${p.apellidos}`.trim();
const etiquetaTarjeta = (t: "AMARILLA" | "AZUL" | "ROJA") => (t === "AMARILLA" ? "🟨 Amarilla" : t === "AZUL" ? "🟦 Azul" : "🟥 Roja");

export function HistorialManager() {
  const [torneos, setTorneos] = useState<TorneoHist[]>([]);
  const [feedback, setFeedback] = useState("");
  const [detalle, setDetalle] = useState<{ partido: PartidoHist; data: Detalle } | null>(null);

  useEffect(() => {
    let active = true;
    http.get<TorneoHist[]>("/api/historial").then((r) => active && setTorneos(r.data)).catch((e) => active && setFeedback(message(e)));
    return () => { active = false; };
  }, []);

  const abrirDetalle = async (p: PartidoHist) => {
    setDetalle(null);
    try {
      const { data } = await http.get<Detalle>(`/api/partidos/${p.id}/acta`);
      setDetalle({ partido: p, data });
    } catch (e) { setFeedback(message(e)); }
  };

  if (detalle) {
    const { partido, data } = detalle;
    const acta = data.acta;
    const porId = new Map<string, Jugador>();
    [...data.equipoLocal.jugadores, ...data.equipoVisitante.jugadores].forEach((j) => porId.set(j.id, j));
    const equipoIdLocal = data.equipoLocal.jugadores[0]?.equipoId ?? data.equipoLocal.id;
    const equipoIdVisit = data.equipoVisitante.jugadores[0]?.equipoId ?? data.equipoVisitante.id;
    const golesLocal = (acta?.goles ?? []).filter((g) => g.equipoId === equipoIdLocal);
    const golesVisit = (acta?.goles ?? []).filter((g) => g.equipoId === equipoIdVisit);
    const tarjetas = acta?.tarjetas ?? [];
    const renderEquipo = (team: Detalle["equipoLocal"]) => {
      const goles = team.id === data.equipoLocal.id ? golesLocal : golesVisit;
      const tarjEquipo = tarjetas.filter((t) => porId.get(t.jugadorId)?.equipoId === (team.jugadores[0]?.equipoId ?? team.id));
      return (
        <details key={team.id} className="rounded-xl border p-4">
          <summary className="flex list-none cursor-pointer items-center justify-between gap-2 font-bold [&::-webkit-details-marker]:hidden">
            <span>{team.nombre}</span>
            <span className="text-stone-400">{goles.length} gol{goles.length === 1 ? "" : "es"}</span>
          </summary>
          <div className="mt-2 text-sm">
            {goles.length === 0 ? <p className="text-stone-400">Sin goles.</p> : goles.map((g, i) => <p key={i}>⚽ {nom(porId.get(g.jugadorId) ?? { nombres: "?", apellidos: "" })} <span className="text-stone-500">{`(${g.minuto}'${g.autogol ? " · autogol" : ""})`}</span></p>)}
            {tarjEquipo.length > 0 && <div className="mt-3 border-t pt-2"><p className="font-semibold">Tarjetas</p>{tarjEquipo.map((t, i) => <p key={i}>{etiquetaTarjeta(t.tipo)} · {nom(porId.get(t.jugadorId) ?? { nombres: "?", apellidos: "" })} <span className="text-stone-500">{`(${t.minuto}')`}</span></p>)}</div>}
          </div>
        </details>
      );
    };
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-black"><History className="size-5" />Historial · {partido.equipoLocal.nombre} vs. {partido.equipoVisitante.nombre}</h2>
          <Button variant="outline" size="sm" onClick={() => setDetalle(null)}><ArrowLeft className="mr-2 size-4" />Volver</Button>
        </div>
        <p className="mb-3 text-sm text-stone-500">{fmtFecha(partido.inicio)}</p>
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-stone-50 p-4"><p className="text-xs font-semibold uppercase text-stone-500">Operador</p><p className="font-bold">{nom({ nombres: acta?.operadorNombre ?? "", apellidos: acta?.operadorApellido ?? "" }) || "—"}</p></div>
          <div className="rounded-xl bg-stone-50 p-4"><p className="text-xs font-semibold uppercase text-stone-500">Árbitro</p><p className="font-bold">{nom({ nombres: acta?.arbitroNombre ?? "", apellidos: acta?.arbitroApellido ?? "" }) || "—"}</p></div>
        </div>
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-stone-100 p-4">
          <span className="flex-1 text-right font-bold">{data.equipoLocal.nombre}</span>
          <span className="rounded-lg bg-white px-4 py-1 font-black text-lg">{golesLocal.length} – {golesVisit.length}</span>
          <span className="flex-1 font-bold">{data.equipoVisitante.nombre}</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">{renderEquipo(data.equipoLocal)}{renderEquipo(data.equipoVisitante)}</div>
      </div>
    );
  }

  const conPartidos = torneos.filter((t) => t.jornadas.some((j) => j.partidos.length > 0));
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 font-black"><History className="size-5" />Historial de partidos finalizados</h2>
      {feedback && <p className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{feedback}</p>}
      {conPartidos.length === 0 ? <p className="text-sm text-stone-400">Aún no hay partidos finalizados.</p> : conPartidos.map((t) => (
        <div key={t.id} className="mb-5">
          <h3 className="mb-2 border-b pb-1 font-bold text-stone-800">{t.nombre}{t.temporada ? ` · ${t.temporada}` : ""}</h3>
          {t.jornadas.filter((j) => j.partidos.length > 0).map((j) => (
            <div key={j.id} className="mb-3">
              <p className="mb-1 text-sm font-semibold text-stone-500">Jornada {j.numero} — {j.nombre}</p>
              <div className="grid gap-2">{j.partidos.map((p) => (
                <button key={p.id} onClick={() => void abrirDetalle(p)} className="flex items-center justify-between gap-3 rounded-xl border p-3 text-left text-sm transition hover:bg-stone-50">
                  <span className="font-semibold">{p.equipoLocal.nombre} vs. {p.equipoVisitante.nombre}</span>
                  <span className="text-xs text-stone-500">{fmtFecha(p.inicio)}</span>
                </button>
              ))}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
