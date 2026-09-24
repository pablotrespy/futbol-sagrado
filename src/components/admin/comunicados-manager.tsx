// Comunicados del torneo: carga de PDFs con resolución y fecha, edición y eliminación.
"use client";

import { AxiosError } from "axios";
import { FileText, Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { http } from "@/lib/http";
import { comunicadoSchema, type ComunicadoInput } from "@/schemas/comunicado";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Comunicado = ComunicadoInput & { id: string; nombreArchivo: string };

const message = (error: unknown) => error instanceof AxiosError ? String(error.response?.data?.error ?? "No fue posible completar la operación") : "Ocurrió un error inesperado";
const fijarFecha = (fecha: Date | string) => new Date(fecha).toISOString().slice(0, 10);

export function ComunicadosManager({ torneoId = "" }: { torneoId?: string }) {
  const [items, setItems] = useState<Comunicado[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [resolucion, setResolucion] = useState("");
  const [fecha, setFecha] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [procesando, setProcesando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try { setItems((await http.get<Comunicado[]>("/api/comunicados", { params: { torneoId } })).data); }
    catch (e) { setFeedback(message(e)); }
  }, [torneoId]);

  useEffect(() => {
    let active = true;
    http.get<Comunicado[]>("/api/comunicados", { params: { torneoId } })
      .then(({ data }) => { if (active) setItems(data); })
      .catch((e) => { if (active) setFeedback(message(e)); });
    return () => { active = false; };
  }, [torneoId]);

  const cancel = () => { setEditing(null); setResolucion(""); setFecha(""); setArchivo(null); if (fileRef.current) fileRef.current.value = ""; setFeedback(""); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validacion = comunicadoSchema.safeParse({ resolucion, fecha });
    if (!validacion.success) { setFeedback(validacion.error.issues[0]?.message ?? "Revisa los datos."); return; }
    if (!editing && !archivo) { setFeedback("Adjunta el PDF del comunicado."); return; }
    setProcesando(true); setFeedback("");
    const form = new FormData();
    form.append("torneoId", torneoId);
    form.append("resolucion", resolucion);
    form.append("fecha", fecha);
    if (archivo) form.append("archivo", archivo);
    try {
      if (editing) await http.put(`/api/comunicados/${editing}`, form, { headers: { "Content-Type": "multipart/form-data" } });
      else await http.post("/api/comunicados", form, { headers: { "Content-Type": "multipart/form-data" } });
      cancel();
      await load();
      setFeedback(editing ? "Comunicado actualizado." : "Comunicado cargado.");
    } catch (e) { setFeedback(message(e)); } finally { setProcesando(false); }
  };

  const editar = (item: Comunicado) => { setEditing(item.id); setResolucion(item.resolucion); setFecha(fijarFecha(item.fecha)); setArchivo(null); if (fileRef.current) fileRef.current.value = ""; setFeedback(""); };
  const remove = async (id: string) => { if (!confirm("¿Eliminar este comunicado?")) return; try { await http.delete(`/api/comunicados/${id}`); await load(); } catch (e) { setFeedback(message(e)); } };

  return <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
    <form onSubmit={submit} className="h-fit rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between"><h2 className="font-black">{editing ? "Editar comunicado" : "Nuevo comunicado"}</h2>{editing && <Button type="button" variant="ghost" size="icon" onClick={cancel}><X className="size-4" /></Button>}</div>
      <div className="grid gap-4">
        <Field label="Resolución N°"><Input placeholder="Ej: 012-2026" value={resolucion} onChange={(e) => setResolucion(e.target.value)} /></Field>
        <Field label="Fecha"><Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></Field>
        <Field label={editing ? "PDF (dejar vacío para mantener el actual)" : "PDF"}><input ref={fileRef} type="file" accept="application/pdf,.pdf" required={!editing} onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} className="block w-full text-sm text-stone-500 file:mr-3 file:rounded-lg file:border-0 file:bg-red-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-red-700 hover:file:bg-red-100" /></Field>
        {feedback && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{feedback}</p>}
        <Button disabled={!torneoId || procesando}><Plus className="mr-2 size-4" />{editing ? "Guardar cambios" : "Subir comunicado"}</Button>
      </div>
    </form>
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between"><h2 className="font-black">Comunicados del torneo</h2><span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold">{items.length}</span></div>
      {!torneoId ? <p className="rounded-xl border border-dashed p-8 text-center text-sm text-stone-500">Selecciona un torneo para ver sus comunicados.</p>
        : items.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center text-sm text-stone-500">Aún no hay comunicados.</p>
        : <div className="grid gap-3">{items.map((item) => <article key={item.id} className="flex items-center gap-3 rounded-xl border border-stone-200 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700"><FileText className="size-5" /></span>
          <div className="min-w-0 flex-1"><h3 className="truncate font-bold">Resolución N° {item.resolucion}</h3><p className="text-sm text-stone-500">{fijarFecha(item.fecha)} · {item.nombreArchivo}</p></div>
          <a href={`/api/comunicados/${item.id}/archivo`} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50">Ver PDF</a>
          <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => editar(item)}><Pencil className="size-4" /></Button>
          <Button variant="danger" size="icon" aria-label="Eliminar" onClick={() => void remove(item.id)}><Trash2 className="size-4" /></Button>
        </article>)}</div>}
    </section>
  </div>;
}