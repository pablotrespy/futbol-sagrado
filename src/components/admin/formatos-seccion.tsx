// Formatos / planillas Excel (subir, descargar, eliminar) para distintos catálogos.
// Se reutiliza con listas de tipos distintas por pestaña (Canchas, Equipos/Jugadores).
"use client";

import { AxiosError } from "axios";
import { Check, Download, FileSpreadsheet, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { http } from "@/lib/http";
import { ETIQUETA_PLANILLA, type TipoPlanilla } from "@/schemas/planilla";
import { Button } from "@/components/ui/button";

type Item = { id: string; nombreArchivo: string; updatedAt: string };
type Planilla = Item & { tipo: string };

const message = (error: unknown) => error instanceof AxiosError ? String(error.response?.data?.error ?? "No fue posible completar la operación") : "Ocurrió un error inesperado";

export function FormatosSeccion({ tipos, titulo, descripcion, empotrado = false, sencillo = false, variante = "rojo" }: { tipos: TipoPlanilla[]; titulo?: string; descripcion?: string; empotrado?: boolean; sencillo?: boolean; variante?: "rojo" | "verde" }) {
  const contenedor = sencillo ? "grid gap-3" : empotrado ? "rounded-b-2xl border border-t-0 border-stone-200 bg-white p-5" : "rounded-2xl border border-stone-200 bg-white p-5 shadow-sm";
  const chip = variante === "verde" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700";
  const borde = variante === "verde" ? "border-emerald-200" : "border-stone-200";
  const [items, setItems] = useState<Record<string, Item | null>>({});
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [procesando, setProcesando] = useState<Record<string, boolean>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const cargar = useCallback(async () => {
    try {
      const { data } = await http.get<Planilla[]>("/api/planillas");
      const mapa: Record<string, Item | null> = {};
      for (const t of tipos) mapa[t] = null;
      for (const item of data) mapa[item.tipo] = item;
      setItems(mapa);
      setError("");
    } catch (causa) { setError(message(causa)); }
  }, [tipos]);

  useEffect(() => {
    let activo = true;
    http.get<Planilla[]>("/api/planillas")
      .then(({ data }) => {
        if (!activo) return;
        const mapa: Record<string, Item | null> = {};
        for (const t of tipos) mapa[t] = null;
        for (const item of data) mapa[item.tipo] = item;
        setItems(mapa);
        setError("");
      })
      .catch((causa) => { if (activo) setError(message(causa)); });
    return () => { activo = false; };
  }, [tipos]);

  const subir = async (tipo: TipoPlanilla, archivo?: File) => {
    const seleccionado = archivo ?? inputRefs.current[tipo]?.files?.[0];
    setError(""); setMensaje("");
    if (!seleccionado) return setError("Selecciona primero el archivo Excel.");
    setProcesando((p) => ({ ...p, [tipo]: true }));
    try {
      const datos = new FormData();
      datos.append("tipo", tipo);
      datos.append("archivo", seleccionado);
      await http.post("/api/planillas", datos, { headers: { "Content-Type": "multipart/form-data" } });
      setMensaje("Formato guardado correctamente.");
      if (inputRefs.current[tipo]) inputRefs.current[tipo].value = "";
      await cargar();
    } catch (causa) { setError(message(causa)); } finally { setProcesando((p) => ({ ...p, [tipo]: false })); }
  };

  const borrar = async (id: string) => {
    if (!confirm("¿Eliminar este formato?")) return;
    setError(""); setMensaje("");
    try { await http.delete(`/api/planillas/${id}`); await cargar(); } catch (causa) { setError(message(causa)); }
  };

  return (
    <div className={contenedor}>
      {(titulo || descripcion) && <>
        {titulo && <h3 className="mb-1 font-black">{titulo}</h3>}
        {descripcion && <p className="mb-4 text-sm text-stone-500">{descripcion}</p>}
      </>}
      <div className="grid gap-3">
        {tipos.map((tipo) => {
          const item = items[tipo];
          const archivo = item?.nombreArchivo ?? "Sin formato cargado";
          return (
            <article key={tipo} className={`flex flex-wrap items-center gap-3 rounded-xl border p-4 ${borde}`}>
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${chip}`}><FileSpreadsheet className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold">{ETIQUETA_PLANILLA[tipo]}</h4>
                <p className="truncate text-sm text-stone-500">{archivo}{item ? ` · ${new Date(item.updatedAt).toLocaleString("es-CO", { dateStyle: "medium" })}` : ""}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={(el) => { inputRefs.current[tipo] = el; }}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => void subir(tipo, e.target.files?.[0])}
                />
                <Button type="button" variant="outline" size="sm" disabled={procesando[tipo]} onClick={() => inputRefs.current[tipo]?.click()}>{procesando[tipo] ? "Subiendo…" : item ? "Cambiar" : "Subir"}</Button>
                {item && <a href={`/api/planillas/${item.id}/archivo`} download className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"><Download className="size-4" />Descargar</a>}
                {item && <Button type="button" variant="danger" size="sm" disabled={procesando[tipo]} onClick={() => void borrar(item.id)}><Trash2 className="mr-1.5 size-3.5" />Eliminar</Button>}
              </div>
            </article>
          );
        })}
      </div>
      {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
      {mensaje && <p className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"><Check className="size-4" />{mensaje}</p>}
    </div>
  );
}