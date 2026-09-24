// Módulo 1 (ampliado): catálogos combinados Canchas / Operador de Mesa / Árbitros.
// Tres líneas colapsables que abren cerradas; solo se muestra una a la vez, con
// botón Cerrar: canchas (formulario + listado) y cargas por Excel que generan
// listas de operadores y Árbitros con eliminación individual.
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { Check, ChevronDown, ChevronRight, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { http } from "@/lib/http";
import { canchaSchema, type CanchaInput } from "@/schemas/cancha";
import type { AnalisisPersonas, EstadoPersona } from "@/lib/importar";
import { Button } from "@/components/ui/button";
import { FormatosSeccion } from "./formatos-seccion";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Cancha = CanchaInput & { id: string };
type Seccion = "canchas" | "operadores" | "arbitros";
type Persona = { id: string; nombres: string; apellidos: string; activo: boolean };
type ModeloPersona = "arbitro" | "operador";

const defaults: CanchaInput = { nombre: "", ubicacion: "", descripcion: "", activa: true };
const message = (error: unknown) => error instanceof AxiosError ? String(error.response?.data?.error ?? "No fue posible completar la operación") : "Ocurrió un error inesperado";

const ETIQUETAS: Record<EstadoPersona, string> = { nuevo: "Nuevo", existente: "Existente", duplicado: "Repetido", error: "Error" };
const CLASES: Record<EstadoPersona, string> = {
  nuevo: "bg-emerald-100 text-emerald-800",
  existente: "bg-blue-100 text-blue-800",
  duplicado: "bg-orange-100 text-orange-800",
  error: "bg-red-100 text-red-700",
};
const rutaModelo = (modelo: ModeloPersona) => (modelo === "arbitro" ? "arbitros" : "operadores");

function PersonasSeccion({ modelo }: { modelo: ModeloPersona }) {
  const ruta = rutaModelo(modelo);
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Persona[]>([]);
  const [analisis, setAnalisis] = useState<AnalisisPersonas | null>(null);
  const [cargando, setCargando] = useState<"cargar" | "analizar" | "confirmar" | null>("cargar");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cargar = useCallback(async () => {
    try {
      setItems((await http.get<Persona[]>(`/api/${ruta}`)).data);
      setError("");
    } catch (causa) {
      setError(message(causa));
    } finally {
      setCargando(null);
    }
  }, [ruta]);

  useEffect(() => {
    let activo = true;
    http.get<Persona[]>(`/api/${ruta}`).then(({ data }) => activo && setItems(data))
      .catch((causa) => activo && setError(message(causa)))
      .finally(() => activo && setCargando(null));
    return () => { activo = false; };
  }, [ruta]);

  const enviar = async (confirmar: boolean) => {
    const archivo = inputRef.current?.files?.[0];
    setError("");
    setMensaje("");
    if (!archivo) return setError("Selecciona primero el archivo Excel.");
    setCargando(confirmar ? "confirmar" : "analizar");
    try {
      const datos = new FormData();
      datos.append("archivo", archivo);
      const respuesta = await http.post<AnalisisPersonas & { confirmado?: boolean; creados?: number; reactivados?: number }>(
        `/api/importar/${ruta}${confirmar ? "?confirmar=1" : ""}`,
        datos,
        { headers: { "Content-Type": "multipart/form-data" }, timeout: 60_000 },
      );
      setAnalisis(respuesta.data);
      if (confirmar) {
        setMensaje(`Carga completada: ${respuesta.data.creados} creado(s), ${respuesta.data.reactivados} reactivado(s).`);
        setAnalisis(null);
        if (inputRef.current) inputRef.current.value = "";
        await cargar();
      }
    } catch (causa) {
      setError(message(causa));
    } finally {
      setCargando(null);
    }
  };

  const borrar = async (id: string) => {
    if (!confirm("¿Eliminar esta persona de la lista?")) return;
    setError("");
    try {
      await http.delete(`/api/${ruta}/${id}`);
      await cargar();
    } catch (causa) {
      setError(message(causa));
    }
  };

  return (
<div className="rounded-b-2xl border border-t-0 border-stone-200 bg-white p-5">
      <div className="mb-4">
        <h3 className="font-black">{modelo === "arbitro" ? "Árbitros" : "Operadores de mesa"}</h3>
      </div>
      <section className="rounded-2xl bg-stone-50 p-4">
        <h4 className="flex items-center gap-2 font-bold"><Upload className="size-4 text-red-800" /> Cargar desde Excel</h4>
        <p className="mt-1 text-sm text-stone-500">Archivo con una hoja y columnas <b>Nombres</b> y <b>Apellidos</b> (una fila por persona).</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={() => { setAnalisis(null); setError(""); setMensaje(""); }}
            className="max-w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold"
          />
          <Button variant="outline" onClick={() => void enviar(false)} disabled={cargando !== null}>
            {cargando === "analizar" ? "Analizando…" : "Analizar"}
          </Button>
          <Button onClick={() => void enviar(true)} disabled={cargando !== null || !analisis || analisis.nuevos === 0}>
            {cargando === "confirmar" ? "Importando…" : `Confirmar (${analisis ? analisis.nuevos : 0})`}
          </Button>
        </div>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
        {mensaje && <p className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"><Check className="size-4" />{mensaje}</p>}
        {analisis && !error && (
          <>
            <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-stone-500">
              <span>Nuevos: {analisis.nuevos}</span>
              <span>Existentes: {analisis.existentes}</span>
              <span>Con problemas: {analisis.errores}</span>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-stone-400">
                    <th className="py-2 pr-4">Fila</th>
                    <th className="py-2 pr-4">Persona</th>
                    <th className="py-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {analisis.filas.map((fila) => (
                    <tr key={`${fila.fila}-${fila.nombres}-${fila.apellidos}`} className="border-t border-stone-100">
                      <td className="py-2 pr-4 text-stone-400">{fila.fila}</td>
                      <td className="py-2 pr-4 font-semibold">{fila.nombres} {fila.apellidos}</td>
                      <td className="py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CLASES[fila.estado]}`}>{ETIQUETAS[fila.estado]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
      <section className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-bold text-stone-600">Lista registrada</p>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold">{items.length}</span>
        </div>
        {cargando === "cargar" ? <p className="text-sm text-stone-500">Cargando…</p> : items.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-center text-sm text-stone-500">Aún no hay {modelo === "arbitro" ? "Árbitros" : "operadores"} cargados.</p> : (
          <div className="grid gap-2">
            {items.map((persona) => (
              <article key={persona.id} className="flex items-center gap-3 rounded-xl border border-stone-200 px-4 py-3">
                <span className={`size-2.5 rounded-full ${persona.activo ? "bg-emerald-500" : "bg-stone-300"}`} />
                <div className="min-w-0 flex-1"><p className="font-bold">{persona.nombres} {persona.apellidos}</p><p className="text-xs text-stone-400">{persona.activo ? "Disponible" : "Inactivo"}</p></div>
                <Button variant="danger" size="icon" aria-label="Eliminar" onClick={() => void borrar(persona.id)} disabled={cargando === "confirmar"}><Trash2 className="size-4" /></Button>
              </article>
            ))}
</div>
        )}
      </section>
      <div className="mt-6 border-t border-stone-200 pt-5">
        <FormatosSeccion titulo="Formato de planilla" sencillo tipos={modelo === "arbitro" ? ["ARBITRO"] : ["OPERADOR_MESA"]} />
      </div>
    </div>
  );
}

export function CanchasManager() {
  const [seccionAbierta, setSeccionAbierta] = useState<Seccion | null>(null);
  const [items, setItems] = useState<Cancha[]>([]); const [editing, setEditing] = useState<string | null>(null); const [feedback, setFeedback] = useState(""); const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CanchaInput>({ resolver: zodResolver(canchaSchema), defaultValues: defaults });
  const load = useCallback(async () => { try { setItems((await http.get<Cancha[]>("/api/canchas")).data); } catch (e) { setFeedback(message(e)); } finally { setLoading(false); } }, []);
  useEffect(() => {
    let active = true;
    http.get<Cancha[]>("/api/canchas").then((response) => { if (active) setItems(response.data); }).catch((error) => { if (active) setFeedback(message(error)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const cancel = () => { setEditing(null); reset(defaults); setFeedback(""); };
  const submit = handleSubmit(async (data) => { try { setFeedback(""); if (editing) await http.put(`/api/canchas/${editing}`, data); else await http.post("/api/canchas", data); cancel(); await load(); } catch (e) { setFeedback(message(e)); } });
  const remove = async (id: string) => { if (!confirm("¿Eliminar esta cancha?")) return; try { await http.delete(`/api/canchas/${id}`); await load(); } catch (e) { setFeedback(message(e)); } };

  const filas = [
    { id: "canchas" as const, titulo: "Canchas", nodo: <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form onSubmit={submit} className="h-fit rounded-b-2xl border border-t-0 border-stone-200 bg-white p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><h2 className="font-black">{editing ? "Editar cancha" : "Nueva cancha"}</h2>{editing && <Button type="button" variant="ghost" size="icon" onClick={cancel}><X className="size-4" /></Button>}</div><div className="grid gap-4">
        <Field label="Nombre" error={errors.nombre?.message}><Input placeholder="Cancha principal" {...register("nombre")} /></Field>
        <Field label="Ubicación" error={errors.ubicacion?.message}><Input placeholder="Sector o dirección" {...register("ubicacion")} /></Field>
        <Field label="Descripción" error={errors.descripcion?.message}><Input placeholder="Superficie, referencias…" {...register("descripcion")} /></Field>
        <label className="flex items-center gap-2 text-sm text-stone-600"><input type="checkbox" className="size-4 accent-red-700" {...register("activa")} /> Disponible para programación</label>
        {feedback && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{feedback}</p>}<Button disabled={isSubmitting}><Plus className="mr-2 size-4" />{editing ? "Guardar cambios" : "Crear cancha"}</Button>
      </div></form>
      <section className="rounded-b-2xl border border-t-0 border-stone-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><h2 className="font-black">Canchas registradas</h2><span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold">{items.length}</span></div>{loading ? <p className="text-sm text-stone-500">Cargando…</p> : items.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center text-sm text-stone-500">Aún no hay canchas.</p> : <div className="grid gap-3">{items.map((item) => <article key={item.id} className="flex items-start gap-3 rounded-xl border border-stone-200 p-4"><span className={`mt-1 size-2.5 rounded-full ${item.activa ? "bg-emerald-500" : "bg-stone-300"}`} /><div className="min-w-0 flex-1"><h3 className="font-bold">{item.nombre}</h3><p className="text-sm text-stone-500">{item.ubicacion || "Sin ubicación"}</p></div><Button variant="ghost" size="icon" aria-label="Editar" onClick={() => { setEditing(item.id); reset(item); }}><Pencil className="size-4" /></Button><Button variant="danger" size="icon" aria-label="Eliminar" onClick={() => void remove(item.id)}><Trash2 className="size-4" /></Button></article>)}</div>}</section>
    </div> },
    { id: "operadores" as const, titulo: "Operador de Mesa", nodo: <PersonasSeccion modelo="operador" /> },
    { id: "arbitros" as const, titulo: "Árbitros", nodo: <PersonasSeccion modelo="arbitro" /> },
  ];

  return <div className="grid gap-3">{filas.map((fila) => {
    const abierta = seccionAbierta === fila.id;
    if (seccionAbierta !== null && !abierta) return null;
    return (
      <div key={fila.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <button type="button" onClick={() => setSeccionAbierta(abierta ? null : fila.id)} className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-stone-50" aria-expanded={abierta}>
          <span className="flex items-center gap-2 font-black">{abierta ? <ChevronDown className="size-5 text-stone-400" /> : <ChevronRight className="size-5 text-stone-400" />}{fila.titulo}</span>
        </button>
        {abierta && (
          <>
            <div className="flex justify-end border-t border-stone-200 bg-stone-50/60 px-5 py-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setSeccionAbierta(null)}><X className="mr-2 size-4" />Cerrar</Button>
            </div>
            {fila.nodo}
          </>
        )}
      </div>
    );
  })}</div>;
}