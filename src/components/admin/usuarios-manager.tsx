// Fase 1 / módulo 11: gestión administrativa de accesos.
// El rol se asigna únicamente al crear el acceso (pestaña "Crear nuevos") y ya no se puede modificar aquí.
// Los delegados aparecen al final de la lista, en un desplegable colapsado por defecto; dentro de cada uno se puede asignar/cambiar su torneo.
"use client";

import { AxiosError } from "axios";
import { ChevronDown, ChevronUp, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { http } from "@/lib/http";
import type { AppRole } from "@/lib/access-policy";

type Usuario = { id: string; name: string; email: string; documento?: string | null; role: AppRole; torneoId: string | null; torneo: { nombre: string } | null };
type Torneo = { id: string; nombre: string; temporada: string; estado: string };
const roleLabels: Record<AppRole, string> = { admin: "Administrador", supervisor: "Supervisor", operador_de_mesa: "Operador de mesa", delegado: "Delegado" };

export function UsuariosManager() {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [torneos, setTorneos] = useState<Torneo[]>([]);
  const [feedback, setFeedback] = useState("");
  const [guardando, setGuardando] = useState<string | null>(null);
  const [delegadosAbiertos, setDelegadosAbiertos] = useState(false);
  const [restableciendo, setRestableciendo] = useState<string | null>(null);
  const [claveGenerada, setClaveGenerada] = useState<{ nombre: string; clave: string } | null>(null);

  useEffect(() => {
    let active = true;
    http.get<Usuario[]>("/api/usuarios").then(({ data }) => { if (active) setUsers(data); }).catch((error: AxiosError<{ error?: string }>) => { if (active) setFeedback(error.response?.data?.error ?? "No fue posible cargar los usuarios"); });
    http.get<Torneo[]>("/api/torneos").then(({ data }) => { if (active) setTorneos(data.filter((t) => t.estado === "ACTIVO")); }).catch(() => { if (active) setTorneos([]); });
    return () => { active = false; };
  }, []);

  const asignarTorneo = async (userId: string, torneoId: string) => {
    setFeedback("");
    setGuardando(userId);
    try {
      const { data } = await http.patch<Usuario>(`/api/usuarios/${userId}`, { torneoId: torneoId || null });
      setUsers((prev) => prev.map((u) => (u.id === userId ? data : u)));
    } catch (error) {
      setFeedback(error instanceof AxiosError ? String(error.response?.data?.error ?? "No fue posible actualizar el torneo") : "Ocurrió un error inesperado");
    } finally {
      setGuardando(null);
    }
  };

  const generarNuevaClave = async (user: Usuario) => {
    if (!window.confirm(`¿Generar una nueva clave para ${user.name}? La clave anterior dejará de funcionar.`)) return;
    setFeedback(""); setClaveGenerada(null); setRestableciendo(user.id);
    try {
      const { data } = await http.post<{ usuario: string; clave: string }>(`/api/usuarios/${user.id}`);
      setClaveGenerada({ nombre: data.usuario, clave: data.clave });
    } catch (error) {
      setFeedback(error instanceof AxiosError ? String(error.response?.data?.error ?? "No fue posible generar la clave") : "Ocurrió un error inesperado");
    } finally { setRestableciendo(null); }
  };

  const accionClave = (user: Usuario) => <button type="button" onClick={() => void generarNuevaClave(user)} disabled={restableciendo === user.id} className="inline-flex items-center gap-1 rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-50 disabled:opacity-60"><KeyRound className="size-3.5" />{restableciendo === user.id ? "Generando…" : "Generar nueva clave"}</button>;

  const otros = users.filter((u) => u.role !== "delegado");
  const delegados = users.filter((u) => u.role === "delegado");

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-5"><h2 className="font-black">Usuarios/Roles</h2><p className="mt-1 text-sm text-stone-500">Define quién administra, supervisa, opera la mesa o consulta. El rol se fija al crear el acceso.</p></div>
      {feedback && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{feedback}</p>}
      {claveGenerada && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><p><b>Nueva clave para {claveGenerada.nombre}:</b> <code className="rounded bg-white px-2 py-1 font-black">{claveGenerada.clave}</code></p><p className="mt-1 text-xs">Entrégala al usuario y recomiéndale cambiarla desde “Cambiar clave”.</p></div>}
      <div className="grid gap-3">{otros.map((user) => (
        <article key={user.id} className="flex flex-col gap-3 rounded-xl border border-stone-200 p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1"><h3 className="font-bold">{user.name}</h3><p className="truncate text-sm text-stone-500">{user.email}</p></div>
          <span className="rounded-xl bg-red-100 px-4 py-2 text-sm font-bold text-red-700">{roleLabels[user.role]}</span>{accionClave(user)}
        </article>
      ))}</div>

      <div className="mt-4">
        <button type="button" onClick={() => setDelegadosAbiertos((v) => !v)} className="flex w-full items-center justify-between gap-2 rounded-xl border border-stone-200 px-4 py-3 text-left text-sm font-bold text-stone-700 transition hover:bg-stone-50" aria-expanded={delegadosAbiertos}>
          <span>Delegados{delegados.length > 0 && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-black text-red-700">{delegados.length}</span>}</span>
          {delegadosAbiertos ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
        {delegadosAbiertos && (
          <div className="mt-3 grid gap-3">
            {delegados.length === 0 ? (
              <p className="rounded-xl bg-stone-50 p-4 text-sm text-stone-500">No hay delegados creados.</p>
            ) : delegados.map((user) => (
              <article key={user.id} className="flex flex-col gap-3 rounded-xl border border-stone-200 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1"><h3 className="font-bold">{user.name}</h3><p className="truncate text-sm text-stone-500">{user.email}</p></div>
                <span className="rounded-xl bg-red-100 px-4 py-2 text-sm font-bold text-red-700">{roleLabels[user.role]}</span>{accionClave(user)}
                <label className="flex flex-col gap-1 text-sm sm:items-end">
                  <span className="text-xs font-semibold text-stone-500">Campeonato a verificar</span>
                  <select
                    value={user.torneoId ?? ""}
                    disabled={guardando === user.id}
                    onChange={(e) => asignarTorneo(user.id, e.target.value)}
                    className="h-9 min-w-44 rounded-xl border border-stone-300 bg-white px-2 text-sm disabled:opacity-60"
                  >
                    <option value="">Sin torneo asignado</option>
                    {torneos.map((t) => <option key={t.id} value={t.id}>{t.nombre} ({t.temporada})</option>)}
                  </select>
                </label>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
