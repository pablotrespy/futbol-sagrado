// Panel administrativo de amonestados: tarjetas agrupadas por jugador + partido, pago y revocación.
"use client";

import { AxiosError } from "axios";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { http } from "@/lib/http";

type Amonestacion = {
  id: string;
  tarjetas: Array<"AMARILLA" | "AZUL" | "ROJA">;
  tipo: string;
  multa: number;
  sancion: { etiqueta: string; duracionFechas: number | null; indefinida: boolean };
  jugador: { id: string; nombres: string; apellidos: string; equipo: { id: string; nombre: string } };
  partidoId: string;
  partido: string;
  inicio: string;
  jornada: number;
  jornadaNombre: string;
  torneoId: string;
  valor: number | null;
  estado: "INHABILITADO" | "HABILITADO";
  pagada: boolean;
  activa: boolean;
  cumplida: boolean;
  revocada: boolean;
  sancionId: string | null;
  pendientes: number | null;
};

const TARJETA_COLORS: Record<string, string> = {
  AMARILLA: "bg-yellow-100 text-yellow-800",
  AZUL: "bg-blue-100 text-blue-800",
  ROJA: "bg-red-100 text-red-800",
};
const NOMBRE_TARJETA: Record<string, string> = { AMARILLA: "Amarilla", AZUL: "Azul", ROJA: "Roja" };

const message = (e: unknown) => e instanceof AxiosError ? String(e.response?.data?.error ?? "Operación fallida") : "Error inesperado";

function formatFecha(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function textoPendiente(a: Amonestacion): string {
  if (a.activa) {
    if (a.sancion.indefinida) return "Suspendido del torneo";
    if (a.pendientes != null && a.pendientes > 0) return `${a.pendientes} ${a.pendientes === 1 ? "fecha" : "fechas"}`;
  }
  return a.sancion.etiqueta;
}

export function SancionesManager({ readOnly = false, torneoId = "", publicApi = false }: { readOnly?: boolean; torneoId?: string; publicApi?: boolean }) {
  const [amonestaciones, setAmonestaciones] = useState<Amonestacion[]>([]);
  const [feedback, setFeedback] = useState("");
  const [procesando, setProcesando] = useState("");
  const [vista, setVista] = useState<"pendientes" | "historico">("pendientes");
  const [pagosRecientes, setPagosRecientes] = useState<Set<string>>(new Set());

  const endpoint = publicApi ? "/api/public/amonestaciones" : "/api/amonestaciones";

  const cargar = useCallback(async () => {
    try {
      const { data } = await http.get<Amonestacion[]>(endpoint, { params: { torneoId } });
      setAmonestaciones(data);
    } catch (e) { setFeedback(message(e)); }
  }, [endpoint, torneoId]);

  useEffect(() => {
    let cancelled = false;
    const timer = setInterval(() => void cargar(), 60_000);
    http.get<Amonestacion[]>(endpoint, { params: { torneoId } })
      .then(({ data }) => { if (!cancelled) setAmonestaciones(data); })
      .catch((e) => { if (!cancelled) setFeedback(message(e)); });
    return () => { cancelled = true; clearInterval(timer); };
  }, [cargar, endpoint, torneoId]);

  const pagar = async (a: Amonestacion) => {
    setFeedback(""); setProcesando(a.id);
    try {
      await http.post("/api/sanciones", {
        jugadorId: a.jugador.id,
        torneoId: a.torneoId,
        partidoId: a.partidoId,
        motivo: "Sanción generada automáticamente",
        tarjeta: a.tipo,
        jornadaInicioNumero: a.jornada + 1,
        duracionFechas: a.sancion.duracionFechas,
        indefinida: a.sancion.indefinida,
        valorPagar: a.multa,
        estadoPago: "PAGADA",
      });
      await cargar();
      setPagosRecientes((prev) => new Set(prev).add(a.id));
      setTimeout(() => setPagosRecientes((prev) => { const next = new Set(prev); next.delete(a.id); return next; }), 20_000);
      setFeedback("Pago registrado. La suspensión queda activa hasta cumplir las fechas.");
    } catch (e) { setFeedback(message(e)); } finally { setProcesando(""); }
  };

  const revocar = async (a: Amonestacion) => {
    if (!a.sancionId) return;
    if (!confirm(`¿Revocar la suspensión de ${a.jugador.nombres} ${a.jugador.apellidos}? Desaparecerá de las sanciones activas.`)) return;
    setFeedback(""); setProcesando(a.id);
    try {
      await http.patch(`/api/sanciones/${a.sancionId}`, { estado: "REVOCADA" });
      await cargar();
      setFeedback("Suspensión revocada.");
    } catch (e) { setFeedback(message(e)); } finally { setProcesando(""); }
  };

  const pendientes = amonestaciones.filter((a) => pagosRecientes.has(a.id) || (!a.pagada && !a.revocada) || a.activa);
  const historico = amonestaciones.filter((a) => !pagosRecientes.has(a.id) && a.pagada && !a.activa);
  const mostrar = vista === "pendientes" ? pendientes : historico;

  const etiquetaEstado = (a: Amonestacion) => {
    if (a.revocada) return { texto: "Revocada", clase: "bg-stone-100 text-stone-600" };
    if (a.pagada && a.cumplida) return { texto: "Cumplida", clase: "bg-emerald-100 text-emerald-700" };
    if (a.pagada) return { texto: "Pagado", clase: "bg-emerald-100 text-emerald-700" };
    return { texto: "Pendiente", clase: "bg-red-100 text-red-700" };
  };

  const BadgeTarjetas = ({ tarjetas }: { tarjetas: Amonestacion["tarjetas"] }) => (
    <div className="flex flex-wrap gap-1">
      {[...tarjetas].sort((a, b) => ({ AMARILLA: 0, AZUL: 1, ROJA: 2 }[a] ?? 9) - ({ AMARILLA: 0, AZUL: 1, ROJA: 2 }[b] ?? 9)).map((t, i) => (
        <span key={i} className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${TARJETA_COLORS[t] ?? "bg-stone-100 text-stone-600"}`}>{NOMBRE_TARJETA[t]}</span>
      ))}
    </div>
  );

  const Acciones = ({ a }: { a: Amonestacion }) => {
    if (readOnly) {
      return null;
    }
    if (!a.pagada && !a.revocada) {
      return <button onClick={() => void pagar(a)} disabled={procesando === a.id} className="rounded-lg bg-red-700 px-3 py-1 text-xs font-bold text-white transition hover:bg-red-800">{procesando === a.id ? "..." : "Pagar"}</button>;
    }
    if (a.pagada && a.activa && a.sancion.indefinida) {
      return <button onClick={() => void revocar(a)} disabled={procesando === a.id} className="rounded-lg bg-stone-700 px-3 py-1 text-xs font-bold text-white transition hover:bg-stone-800">{procesando === a.id ? "..." : "Revocar suspensión"}</button>;
    }
    return null;
  };

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl bg-white p-3 shadow-sm sm:p-4">
        {!readOnly && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-black">
              {vista === "historico" ? "Amonestados — Histórico" : "Amonestados — Pendientes"}
            </h2>
            {vista === "historico" ? (
              <button type="button" onClick={() => setVista("pendientes")} className="rounded-xl border border-red-700 px-4 py-1.5 text-sm font-bold text-red-700 transition hover:bg-red-50">✕ Cerrar</button>
            ) : (
              <button type="button" onClick={() => setVista("historico")} className="rounded-xl bg-red-700 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-red-800">Histórico</button>
            )}
          </div>
        )}

        {mostrar.length === 0 ? (
          <p className="text-sm text-stone-400">{publicApi ? "No hay amonestaciones en este torneo." : vista === "historico" ? "Aún no hay sanciones cumplidas o revocadas." : "No hay amonestaciones pendientes."}</p>
        ) : (
          <div>
            <div className="grid gap-3 md:hidden">
              {mostrar.map((a) => {
                const estado = etiquetaEstado(a);
                return (
                  <div key={a.id} className="rounded-xl border border-stone-200 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 text-xs leading-tight">
                        <span className="font-medium leading-tight">{a.jugador.nombres} {a.jugador.apellidos}</span>
                        <span className="ml-2 text-stone-600">({a.jugador.equipo.nombre})</span>
                      </p>
                      {publicApi ? (
                        <BadgeTarjetas tarjetas={a.tarjetas} />
                      ) : (
                        <span className={`inline-block shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${estado.clase}`}>{estado.texto}</span>
                      )}
                    </div>
                    {!publicApi && <BadgeTarjetas tarjetas={a.tarjetas} />}
                    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                      <div className="min-w-0"><dt className="text-[11px] text-stone-500">Fecha</dt><dd className="break-words">{formatFecha(a.inicio)}</dd></div>
                      <div className="min-w-0"><dt className="text-[11px] text-stone-500">Partido</dt><dd className="break-words">{a.partido}</dd></div>
                      <div className="min-w-0"><dt className="text-[11px] text-stone-500">Sanción</dt><dd className="break-words">{publicApi ? textoPendiente(a) : a.sancion.etiqueta}</dd></div>
                      {!publicApi && <div className="min-w-0"><dt className="text-[11px] text-stone-500">Valor</dt><dd className="font-medium">{a.valor != null ? `$${a.valor.toLocaleString("es-CO")}` : "—"}</dd></div>}
                    </dl>
                    {!readOnly && <div className="mt-2"><Acciones a={a} /></div>}
                  </div>
                );
              })}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs text-stone-500">
                    <th className="p-3">Jugador</th>
                    <th className="p-3">Equipo</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Partido</th>
                    <th className="p-3">Tarjetas</th>
                    <th className="p-3">Sanción</th>
                    {!publicApi && <th className="p-3 text-right">Valor $</th>}
                    {!publicApi && <th className="p-3">Estado</th>}
                    {!readOnly && <th className="p-3 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {mostrar.map((a, i) => {
                    const estado = etiquetaEstado(a);
                    return (
                      <tr key={a.id} className={`border-b last:border-0 ${i % 2 === 0 ? "bg-stone-50" : ""}`}>
                        <td className="p-3 font-bold">
                          {publicApi ? (
                            <Link href={`/jugadores/${a.jugador.id}`} className="hover:underline">{a.jugador.nombres} {a.jugador.apellidos}</Link>
                          ) : a.jugador.nombres + " " + a.jugador.apellidos}
                        </td>
                        <td className="p-3 text-stone-500">{a.jugador.equipo.nombre}</td>
                        <td className="p-3 text-stone-500">{formatFecha(a.inicio)}</td>
                        <td className="p-3 text-stone-500">{a.partido}</td>
                        <td className="p-3"><BadgeTarjetas tarjetas={a.tarjetas} /></td>
                        <td className="p-3 font-medium">{publicApi ? textoPendiente(a) : a.sancion.etiqueta}</td>
                        {!publicApi && <td className="p-3 text-right font-semibold">{a.valor != null ? `$${a.valor.toLocaleString("es-CO")}` : "—"}</td>}
                        {!publicApi && <td className="p-3"><span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${estado.clase}`}>{estado.texto}</span></td>}
                        {!readOnly && <td className="p-3 text-right"><Acciones a={a} /></td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {feedback && <p className="rounded-xl bg-amber-50 p-3 text-sm">{feedback}</p>}
    </div>
  );
}
