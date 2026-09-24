// Fase 5+: tarjeta de importación de equipos desde Excel con vista previa.
"use client";

import { ChevronDown, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { http } from "@/lib/http";
import axios from "axios";
import { Button } from "@/components/ui/button";

type FilaAnalizada = { fila: number; nombre: string; color: string; estado: "nuevo" | "existente" | "duplicado" | "error"; detalle: string };
type Analisis = { filas: FilaAnalizada[]; nuevos: number; existentes: number; errores: number; creados: number };

const ETIQUETAS = { nuevo: "Nuevo", existente: "Ya existe", duplicado: "Repetido", error: "Error" } as const;
const CLASES = {
  nuevo: "bg-emerald-100 text-emerald-800",
  existente: "bg-stone-200 text-stone-600",
  duplicado: "bg-orange-100 text-orange-800",
  error: "bg-red-100 text-red-700",
} as const;

export function ImportarEquipos({ alTerminar, torneoId }: { alTerminar?: () => void; torneoId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [analisis, setAnalisis] = useState<Analisis | null>(null);
  const [cargando, setCargando] = useState<"analizar" | "confirmar" | null>(null);
  const [pendienteConf, setPendienteConf] = useState(false);
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
      const respuesta = await http.post<Analisis>(`/api/importar/equipos?torneoId=${encodeURIComponent(torneoId)}${confirmar ? "&confirmar=1" : ""}`, datos, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAnalisis(respuesta.data);
      if (confirmar) {
        setMensaje(`Importación completada: ${respuesta.data.creados} equipo(s) creado(s). Los verás en la lista de abajo.`);
        setPendienteConf(false);
        alTerminar?.();
      }
    } catch (causa) {
      setError(axios.isAxiosError(causa) ? causa.response?.data?.error ?? "No fue posible procesar el archivo." : "No fue posible procesar el archivo.");
    } finally {
      setCargando(null);
    }
  };

  return (
    <section className="rounded-2xl bg-white shadow-sm">
      <button
        type="button"
        aria-expanded={abierto}
        onClick={() => {
          setAbierto((v) => !v);
          setAnalisis(null);
          setError("");
          setMensaje("");
          setPendienteConf(false);
        }}
        className="flex w-full items-center justify-between gap-2 px-5 py-4 text-left"
      >
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Upload className="size-5 text-red-800" /> Importar equipos desde Excel
        </h2>
        <ChevronDown className={`size-5 shrink-0 text-stone-400 transition-transform ${abierto ? "" : "-rotate-90"}`} />
      </button>
      {abierto && (
        <div className="border-t border-stone-200 p-5">
      <p className="mt-1 text-sm text-stone-500">
        Sube la planilla con columnas <strong>Nombre</strong> y <strong>color</strong>. Se omite automáticamente los equipos que ya existen y crea solo los faltantes.
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
            setPendienteConf(false);
          }}
          className="max-w-full rounded-lg border border-stone-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold"
        />
        <Button variant="outline" onClick={() => enviar(false)} disabled={cargando !== null}>
          {cargando === "analizar" ? "Analizando…" : "Analizar"}
        </Button>
        {!pendienteConf && (
          <Button
            onClick={() => setPendienteConf(true)}
            disabled={cargando !== null || !analisis || analisis.nuevos === 0}
          >
            {cargando === "confirmar" ? "Importando…" : `Confirmar e importar (${analisis?.nuevos ?? 0})`}
          </Button>
        )}
        {analisis && (
          <Button variant="outline" onClick={() => { setAnalisis(null); setError(""); setMensaje(""); setPendienteConf(false); if (inputRef.current) inputRef.current.value = ""; }}>
            Limpiar
          </Button>
        )}
      </div>
      {pendienteConf && analisis && analisis.nuevos > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-semibold text-red-800">Se van a crear {analisis.nuevos} equipo(s) nuevos. ¿Continuar?</p>
          <div className="flex gap-2">
            <Button onClick={() => enviar(true)} disabled={cargando !== null}>
              {cargando === "confirmar" ? "Importando…" : "Sí, importar"}
            </Button>
            <Button variant="outline" onClick={() => setPendienteConf(false)} disabled={cargando !== null}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
      {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
      {mensaje && <p className="mt-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{mensaje}</p>}
      {analisis && !error && (
        <>
          <div className="mt-4 flex gap-4 text-xs font-semibold text-stone-500">
            <span>Nuevos: {analisis.nuevos}</span>
            <span>Ya existen: {analisis.existentes}</span>
            <span>Con problemas: {analisis.errores}</span>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-stone-400">
                  <th className="py-2 pr-4">Fila</th>
                  <th className="py-2 pr-4">Nombre</th>
                  <th className="py-2 pr-4">Color</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {analisis.filas.map((fila) => (
                  <tr key={fila.fila} className="border-t border-stone-100">
                    <td className="py-2 pr-4 text-stone-400">{fila.fila}</td>
                    <td className="py-2 pr-4 font-semibold">{fila.nombre}</td>
                    <td className="py-2 pr-4 text-stone-500">{fila.color || "—"}</td>
                    <td className="py-2 pr-4"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CLASES[fila.estado]}`}>{ETIQUETAS[fila.estado]}</span></td>
                    <td className="py-2 text-stone-500">{fila.detalle || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
        </div>
      )}
    </section>
  );
}
