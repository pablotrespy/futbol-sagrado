// Fase 2 / módulo 3: lista de torneos con toggle Activo/Desactivo y edición (solo admin edita).
"use client";

import { AxiosError } from "axios";
import { Ban, Pencil, X } from "lucide-react";
import { useEffect, useState } from "react";
import { http } from "@/lib/http";
import { ordenarPorTemporada } from "@/lib/torneos";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Torneo = { id: string; nombre: string; temporada: string; estado: "BORRADOR" | "ACTIVO" | "FINALIZADO" | "CANCELADO"; createdAt: string; tienePartidos: boolean };
type EstadoTorneo = "ACTIVO" | "BORRADOR" | "CANCELADO";

export function ListaTorneos({ role }: { role: string }) {
  const esAdmin = role === "admin";
  const [torneos, setTorneos] = useState<Torneo[]>([]);
  const [feedback, setFeedback] = useState("");
  const [cambiando, setCambiando] = useState("");
  const [editandoId, setEditandoId] = useState("");
  const [nombre, setNombre] = useState("");
  const [temporada, setTemporada] = useState("");

  const load = async () => {
    try {
      const { data } = await http.get<Torneo[]>("/api/torneos");
      setTorneos(ordenarPorTemporada(data));
    } catch (error) {
      setFeedback(error instanceof AxiosError ? String(error.response?.data?.error ?? "No fue posible cargar los torneos") : "Ocurrió un error inesperado");
    }
  };

  useEffect(() => { let active = true; http.get<Torneo[]>("/api/torneos").then(({ data }) => { if (active) setTorneos(ordenarPorTemporada(data)); }).catch((error: AxiosError<{ error?: string }>) => { if (active) setFeedback(error.response?.data?.error ?? "No fue posible cargar los torneos"); }); return () => { active = false; }; }, []);

  const toggle = async (torneo: Torneo) => {
    setFeedback(""); setCambiando(torneo.id);
    const nuevo = torneo.estado === "ACTIVO" ? "BORRADOR" as EstadoTorneo : "ACTIVO" as EstadoTorneo;
    try {
      await http.put(`/api/torneos/${torneo.id}`, { estado: nuevo });
      await load();
    } catch (error) {
      setFeedback(error instanceof AxiosError ? String(error.response?.data?.error ?? "No fue posible cambiar el estado") : "Ocurrió un error inesperado");
    } finally {
      setCambiando("");
    }
  };

  const iniciarEdicion = (torneo: Torneo) => { setEditandoId(torneo.id); setNombre(torneo.nombre); setTemporada(torneo.temporada); setFeedback(""); };
  const cancelarEdicion = () => { setEditandoId(""); setNombre(""); setTemporada(""); };

  const cancelarTorneo = async (torneo: Torneo) => {
    if (!confirm(`¿Cancelar el torneo "${torneo.nombre}"? Esta acción no se puede deshacer y lo oculta del campeonato.`)) return;
    setFeedback(""); setCambiando(torneo.id);
    try {
      await http.put(`/api/torneos/${torneo.id}`, { estado: "CANCELADO" });
      await load();
    } catch (error) {
      setFeedback(error instanceof AxiosError ? String(error.response?.data?.error ?? "No fue posible cancelar el torneo") : "Ocurrió un error inesperado");
    } finally {
      setCambiando("");
    }
  };

  const guardar = async (id: string) => {
    setFeedback(""); setCambiando(id);
    try {
      await http.put(`/api/torneos/${id}`, { nombre: nombre.trim(), temporada: temporada.trim() });
      setEditandoId(""); setNombre(""); setTemporada("");
      await load();
    } catch (error) {
      setFeedback(error instanceof AxiosError ? String(error.response?.data?.error ?? "No fue posible guardar el torneo") : "Ocurrió un error inesperado");
    } finally {
      setCambiando("");
    }
  };

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-5"><h2 className="font-black">Lista de Torneos</h2><p className="mt-1 text-sm text-stone-500">Consulta y administra el estado de cada torneo programado.</p></div>
      {feedback && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{feedback}</p>}
      <div className="overflow-x-auto rounded-xl border border-stone-200">
        <table className="w-full min-w-96 text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-left">
              <th className="px-4 py-3 font-semibold text-stone-600">Nombre</th>
              <th className="px-4 py-3 font-semibold text-stone-600">Temporada</th>
              <th className="px-4 py-3 font-semibold text-stone-600">Creado</th>
              <th className="px-4 py-3 text-right font-semibold text-stone-600">Estado</th>
              {esAdmin && <th className="px-4 py-3 text-right font-semibold text-stone-600">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {torneos.length === 0 ? <tr><td colSpan={esAdmin ? 5 : 4} className="px-4 py-8 text-center text-stone-500">Aún no hay torneos programados.</td></tr> : torneos.map((torneo) => {
              const activo = torneo.estado === "ACTIVO";
              const cancelado = torneo.estado === "CANCELADO";
              const tienePartidos = torneo.tienePartidos;
              const editando = editandoId === torneo.id;
              return (
                <tr key={torneo.id} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-stone-800">
                    {editando ? (
                      <div className="grid gap-2">
                        <Field label="Nombre"><Input value={nombre} onChange={(e) => setNombre(e.target.value)} /></Field>
                        <Field label="Temporada"><Input value={temporada} onChange={(e) => setTemporada(e.target.value)} /></Field>
                      </div>
                    ) : torneo.nombre}
                  </td>
                  <td className="px-4 py-3 text-stone-500">{torneo.temporada}</td>
                  <td className="px-4 py-3 text-stone-500">{new Date(torneo.createdAt).toLocaleDateString("es-CO")}</td>
                  <td className="px-4 py-3 text-right">
                    {cancelado ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-stone-200 px-3 py-1.5 text-sm font-semibold text-stone-600">
                        <span className="grid size-4 place-items-center rounded border-2 border-stone-500"><span className="size-1.5 rounded-full bg-stone-500" /></span>
                        Cancelado
                      </span>
                    ) : (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={activo}
                        disabled={!esAdmin || cambiando === torneo.id || editando}
                        onClick={() => void toggle(torneo)}
                        title={esAdmin ? (activo ? "Clic para desactivar" : "Clic para activar") : (activo ? "Activo" : "Inactivo")}
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${activo ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"} ${esAdmin ? "cursor-pointer hover:ring-2 hover:ring-stone-300" : "cursor-default opacity-80"}`}
                      >
                        <span className={`grid size-4 place-items-center rounded border-2 ${activo ? "border-emerald-600 bg-emerald-600" : "border-red-600 bg-red-600"}`}><span className="size-1.5 rounded-full bg-white" /></span>
                        {activo ? "Activo" : "Inactivo"}
                      </button>
                    )}
                  </td>
                  {esAdmin && (
                    <td className="px-4 py-3 text-right">
                      {editando ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" disabled={cambiando === torneo.id} onClick={() => void guardar(torneo.id)}>{cambiando === torneo.id ? "Guardando..." : "Guardar"}</Button>
                          <Button variant="ghost" size="icon" onClick={cancelarEdicion} aria-label="Cancelar edición"><X className="size-4" /></Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" disabled={cancelado || cambiando === torneo.id} onClick={() => iniciarEdicion(torneo)}><Pencil className="mr-2 size-3.5" />Editar</Button>
                          <Button variant="danger" size="sm" disabled={cancelado || tienePartidos || cambiando === torneo.id} title={tienePartidos ? "Un torneo con partidos solo se puede inactivar" : undefined} onClick={() => void cancelarTorneo(torneo)}>{cambiando === torneo.id ? "..." : <><Ban className="mr-2 size-3.5" />Cancelar</>}</Button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!esAdmin && <p className="mt-3 text-xs text-stone-500">Solo el administrador puede activar, desactivar, editar o cancelar los torneos.</p>}
    </section>
  );
}
