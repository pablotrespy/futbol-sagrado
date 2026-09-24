// Fase 1 / módulo 2: interfaz CRUD mobile-first para equipos.
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AxiosError } from "axios";
import { http } from "@/lib/http";
import { equipoSchema, type EquipoInput } from "@/schemas/equipo";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Equipo = EquipoInput & { id: string; _count: { jugadores: number } };
const defaults: EquipoInput = { torneoId: "", nombre: "", color: "", activo: true };
const message = (e: unknown) => e instanceof AxiosError ? String(e.response?.data?.error ?? "No fue posible completar la operación") : "Ocurrió un error inesperado";

export function EquiposManager({ torneoId }: { torneoId: string }) {
  const [items, setItems] = useState<Equipo[]>([]); const [editing, setEditing] = useState<string | null>(null); const [feedback, setFeedback] = useState(""); const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EquipoInput>({ resolver: zodResolver(equipoSchema), defaultValues: { ...defaults, torneoId } });
  const load = useCallback(async () => { try { setItems((await http.get<Equipo[]>("/api/equipos", { params: { torneoId } })).data); } catch (e) { setFeedback(message(e)); } finally { setLoading(false); } }, [torneoId]);
  useEffect(() => {
    let active = true;
    http.get<Equipo[]>("/api/equipos", { params: { torneoId } }).then((response) => { if (active) setItems(response.data); }).catch((error) => { if (active) setFeedback(message(error)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [torneoId]);
  const cancel = () => { setEditing(null); reset({ ...defaults, torneoId }); setFeedback(""); };
  const submit = handleSubmit(async (data) => { try { if (editing) await http.put(`/api/equipos/${editing}`, data); else await http.post("/api/equipos", data); cancel(); await load(); } catch (e) { setFeedback(message(e)); } });
  const remove = async (id: string) => { if (!confirm("¿Eliminar este equipo? Sus jugadores deben eliminarse o reasignarse primero.")) return; try { await http.delete(`/api/equipos/${id}`); await load(); } catch (e) { setFeedback(message(e)); } };

  return <div className="grid gap-6 lg:grid-cols-[360px_1fr]"><form onSubmit={submit} className="h-fit rounded-2xl bg-white p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><h2 className="font-black">{editing ? "Editar equipo" : "Nuevo equipo"}</h2>{editing && <Button type="button" variant="ghost" size="icon" onClick={cancel}><X className="size-4" /></Button>}</div><div className="grid gap-4"><Field label="Nombre" error={errors.nombre?.message}><Input placeholder="Nombre del equipo" {...register("nombre")} /></Field><Field label="Color representativo" error={errors.color?.message}><Input placeholder="Rojo, azul…" {...register("color")} /></Field><label className="flex items-center gap-2 text-sm text-stone-600"><input type="checkbox" className="size-4 accent-red-700" {...register("activo")} /> Equipo activo</label>{feedback && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{feedback}</p>}<Button disabled={isSubmitting}><Plus className="mr-2 size-4" />{editing ? "Guardar cambios" : "Crear equipo"}</Button></div></form>
    <section className="rounded-2xl bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><h2 className="font-black">Equipos registrados</h2><span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold">{items.length}</span></div>{loading ? <p className="text-sm text-stone-500">Cargando…</p> : items.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center text-sm text-stone-500">Aún no hay equipos.</p> : <div className="grid gap-3 sm:grid-cols-2">{items.map((item) => <article key={item.id} className="rounded-xl border border-stone-200 p-4"><div className="flex items-start"><div className="min-w-0 flex-1"><h3 className="font-bold">{item.nombre}</h3><p className="text-sm text-stone-500">{item.color || "Sin color"} · {item._count.jugadores} jugadores</p></div><span className={`size-2.5 rounded-full ${item.activo ? "bg-emerald-500" : "bg-stone-300"}`} /></div><div className="mt-4 flex gap-2"><Button variant="outline" size="sm" onClick={() => { setEditing(item.id); reset({ torneoId, nombre: item.nombre, color: item.color, activo: item.activo }); }}><Pencil className="mr-2 size-3.5" />Editar</Button><Button variant="danger" size="sm" onClick={() => void remove(item.id)}><Trash2 className="mr-2 size-3.5" />Eliminar</Button></div></article>)}</div>}</section>
  </div>;
}
