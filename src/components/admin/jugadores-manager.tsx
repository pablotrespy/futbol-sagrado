// Fase 6: plantillas de jugadores por equipo — importación con reemplazo total,
// exportación a Excel y vista desplegable por club. Sin edición individual.
"use client";

import { ChevronDown, ChevronRight, Download, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { http } from "@/lib/http";
import { calcularEdad } from "@/lib/edad";
import type { AnalisisJugadores, EstadoJugador } from "@/lib/importar";
import { Button } from "@/components/ui/button";
import { ImportarEquipos } from "./importar-equipos";
import { FormatosSeccion } from "./formatos-seccion";

type Equipo = { id: string; nombre: string; activo: boolean };
type Jugador = { id: string; nombres: string; apellidos: string; documento: string | null; fechaNacimiento: string | null; numeroCamiseta: number | null; activo: boolean; vinculo: string | null; equipoId: string };

const ETIQUETAS: Record<EstadoJugador, string> = { nuevo: "Nuevo", actualizado: "Actualizado", repetido: "Repetido", error: "Error" };
const CLASES: Record<EstadoJugador, string> = {
  nuevo: "bg-emerald-100 text-emerald-800",
  actualizado: "bg-blue-100 text-blue-800",
  repetido: "bg-orange-100 text-orange-800",
  error: "bg-red-100 text-red-700",
};

function ImportarPlantillas({ alTerminar, torneoId }: { alTerminar: () => void; torneoId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [analisis, setAnalisis] = useState<AnalisisJugadores | null>(null);
  const [cargando, setCargando] = useState<"analizar" | "confirmar" | null>(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const enviar = async (confirmar: boolean) => {
    const archivo = inputRef.current?.files?.[0];
    setError("");
    setMensaje("");
    if (!archivo) {
      setError("Selecciona primero el archivo Excel.");
      return;
    }
    setCargando(confirmar ? "confirmar" : "analizar");
    try {
      const datos = new FormData();
      datos.append("archivo", archivo);
      const respuesta = await http.post<AnalisisJugadores & { confirmado?: boolean; creados?: number; actualizados?: number; desactivados?: number }>(
        `/api/importar/jugadores?torneoId=${encodeURIComponent(torneoId)}${confirmar ? "&confirmar=1" : ""}`,
        datos,
        { headers: { "Content-Type": "multipart/form-data" }, timeout: 60_000 },
      );
      setAnalisis(respuesta.data);
      if (confirmar) {
        setMensaje(`Reemplazo completado: ${respuesta.data.creados} creado(s), ${respuesta.data.actualizados} actualizado(s), ${respuesta.data.desactivados} desactivado(s).`);
        alTerminar();
      }
    } catch (causa) {
      setError(axios.isAxiosError(causa) ? causa.response?.data?.error ?? "No fue posible procesar el archivo." : "No fue posible procesar el archivo.");
    } finally {
      setCargando(null);
    }
  };

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Upload className="size-5 text-red-800" /> Reemplazar plantillas desde Excel
      </h2>
      <p className="mt-1 text-sm text-stone-500">
        Una hoja por equipo (nombre de hoja = nombre del equipo), una fila por jugador con columnas Nombres, Apellidos, Documento, Fecha nacimiento y Nº camiseta.
        Al confirmar, <strong>cada plantel listado se reemplaza completo</strong>: los jugadores que falten quedan inactivos conservando su historial.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={() => {
            setAnalisis(null);
            setError("");
            setMensaje("");
          }}
          className="max-w-full rounded-lg border border-stone-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold"
        />
        <Button variant="outline" onClick={() => enviar(false)} disabled={cargando !== null}>
          {cargando === "analizar" ? "Analizando…" : "Analizar"}
        </Button>
        <a
          href={`/api/exportar/jugadores?torneoId=${encodeURIComponent(torneoId)}`}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
        >
          <Download className="size-4" /> Exportar plantillas
        </a>
        <Button onClick={() => enviar(true)} disabled={cargando !== null || !analisis || analisis.nuevos + analisis.actualizados === 0}>
          {cargando === "confirmar" ? "Importando…" : `Confirmar reemplazo (${analisis ? analisis.nuevos + analisis.actualizados : 0})`}
        </Button>
        {analisis && (
          <Button variant="outline" onClick={() => { setAnalisis(null); setError(""); setMensaje(""); if (inputRef.current) inputRef.current.value = ""; }}>
            Limpiar
          </Button>
        )}
      </div>
      {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
      {mensaje && <p className="mt-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{mensaje}</p>}
      {analisis && !error && (
        <>
          <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-stone-500">
            <span>Nuevos: {analisis.nuevos}</span>
            <span>Actualizados: {analisis.actualizados}</span>
            <span>Con problemas: {analisis.errores}</span>
          </div>
          {analisis.equiposNoEncontrados.length > 0 && (
            <p className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Hojas sin equipo correspondiente: {analisis.equiposNoEncontrados.join(", ")}. Esas hojas se ignorarán.
            </p>
          )}
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-stone-400">
                  <th className="py-2 pr-4">Equipo</th>
                  <th className="py-2 pr-4">Fila</th>
                  <th className="py-2 pr-4">Jugador</th>
                  <th className="py-2 pr-4">Camiseta</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {analisis.plantillas.flatMap((plantilla) =>
                  plantilla.filas.map((fila) => (
                    <tr key={`${plantilla.hoja}-${fila.fila}`} className="border-t border-stone-100">
                      <td className="py-2 pr-4 font-semibold">{plantilla.equipo ?? <span className="text-red-600">{plantilla.hoja}</span>}</td>
                      <td className="py-2 pr-4 text-stone-400">{fila.fila}</td>
                      <td className="py-2 pr-4">{fila.nombres} {fila.apellidos}</td>
                      <td className="py-2 pr-4 text-stone-500">{fila.numeroCamiseta ?? "—"}</td>
                      <td className="py-2 pr-4"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CLASES[fila.estado]}`}>{ETIQUETAS[fila.estado]}</span></td>
                      <td className="py-2 text-stone-500">{fila.detalle || "—"}</td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

export function JugadoresManager({ torneoId }: { torneoId: string }) {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = async () => {
    try {
      const [respuestaEquipos, respuestaJugadores] = await Promise.all([http.get<Equipo[]>("/api/equipos", { params: { torneoId } }), http.get<Jugador[]>("/api/jugadores")]);
      setEquipos(respuestaEquipos.data.filter((equipo) => equipo.activo));
      setJugadores(respuestaJugadores.data);
      setError("");
    } catch (causa) {
      setError(axios.isAxiosError(causa) ? causa.response?.data?.error ?? "No fue posible cargar los datos." : "Ocurrió un error inesperado.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    let activo = true;
    Promise.all([http.get<Equipo[]>("/api/equipos", { params: { torneoId } }), http.get<Jugador[]>("/api/jugadores")]).then(([equiposRespuesta, jugadoresRespuesta]) => {
      if (!activo) return;
      setEquipos(equiposRespuesta.data.filter((equipo) => equipo.activo));
      setJugadores(jugadoresRespuesta.data);
    }).catch((causa) => {
      if (activo) setError(axios.isAxiosError(causa) ? causa.response?.data?.error ?? "No fue posible cargar los datos." : "Ocurrió un error inesperado.");
    }).finally(() => {
      if (activo) setCargando(false);
    });
    return () => {
      activo = false;
    };
  }, [torneoId]);

  const plantelDe = (equipoId: string) => jugadores.filter((jugador) => jugador.equipoId === equipoId);

  return (
    <div className="grid gap-6">
      <ImportarEquipos alTerminar={() => void cargar()} torneoId={torneoId} />
      <ImportarPlantillas alTerminar={() => void cargar()} torneoId={torneoId} />
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-black">Plantillas por equipo</h2>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold">{equipos.length} equipos</span>
        </div>
        {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {cargando ? (
          <p className="text-sm text-stone-500">Cargando…</p>
        ) : equipos.length === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-stone-500">Aún no hay equipos activos.</p>
        ) : (
          <div className="grid gap-2">
            {equipos.map((equipo) => {
              const plantel = plantelDe(equipo.id);
              const expandido = abierto === equipo.id;
              return (
                <div key={equipo.id} className="overflow-hidden rounded-xl border border-stone-200">
                  <button
                    onClick={() => setAbierto(expandido ? null : equipo.id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-stone-50"
                    aria-expanded={expandido}
                  >
                    <span className="flex items-center gap-2 font-bold">
                      {expandido ? <ChevronDown className="size-4 text-stone-400" /> : <ChevronRight className="size-4 text-stone-400" />}
                      {equipo.nombre}
                    </span>
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-500">{plantel.length} jugador(es)</span>
                  </button>
                  {expandido && (
                    plantel.length === 0 ? (
                      <p className="border-t border-stone-100 px-4 py-6 text-center text-sm text-stone-400">Sin jugadores registrados.</p>
                    ) : (
                      <div className="overflow-x-auto border-t border-stone-100">
                        <table className="w-full min-w-[560px] text-left text-sm">
                          <thead>
                            <tr className="bg-stone-50 text-xs uppercase tracking-wide text-stone-400">
                              <th className="px-4 py-2">Camiseta</th>
                              <th className="px-4 py-2">Jugador</th>
                              <th className="px-4 py-2">Documento</th>
                              <th className="px-4 py-2">Nacimiento</th>
                              <th className="px-4 py-2">Edad</th>
                              <th className="px-4 py-2">Vínculo</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...plantel].sort((a, b) => (a.numeroCamiseta ?? 9999) - (b.numeroCamiseta ?? 9999) || a.apellidos.localeCompare(b.apellidos)).map((jugador) => (
                              <tr key={jugador.id} className="border-t border-stone-100">
                                <td className="px-4 py-2 font-mono">{jugador.numeroCamiseta ?? "—"}</td>
                                <td className="px-4 py-2 font-semibold">{jugador.nombres} {jugador.apellidos}</td>
                                <td className="px-4 py-2 text-stone-500">{jugador.documento || "—"}</td>
                                <td className="px-4 py-2 text-stone-500">{jugador.fechaNacimiento ? jugador.fechaNacimiento.slice(0, 10) : "—"}</td>
                                <td className="px-4 py-2 text-stone-500">{calcularEdad(jugador.fechaNacimiento) ?? "—"}</td>
                                <td className="px-4 py-2 text-stone-500">{jugador.vinculo || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-6 border-t border-stone-200 pt-5">
          <FormatosSeccion sencillo variante="verde" tipos={["EQUIPOS", "JUGADORES"]} />
        </div>
      </section>
    </div>
  );
}
