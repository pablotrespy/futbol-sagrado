// Fase 6 / usuarios: alta manual de accesos por parte de admin/supervisor.
// Pestaña unificada "Crear Usuarios": formulario (izq.) + Usuarios/Roles (der.) + recuperaciones plegables bajo el formulario.
"use client";

import { AxiosError } from "axios";
import { useEffect, useState, type FormEvent } from "react";
import { ChevronDown, ChevronUp, KeyRound, RefreshCw, UserPlus } from "lucide-react";
import { http } from "@/lib/http";
import { assignableRoles, type AppRole } from "@/lib/access-policy";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { UsuariosManager } from "./usuarios-manager";

const roleLabels: Record<AppRole, string> = { admin: "Administrador", supervisor: "Supervisor", operador_de_mesa: "Operador de mesa", delegado: "Delegado" };

type Credenciales = { usuario: string; clave: string; rol: AppRole };
type Recuperacion = { id: string; nombre: string; usuario: string | null; telefono: string | null; codigo: string; expiresAt: string };

export function CrearNuevosManager({ role }: { role: string }) {
  const [nombre, setNombre] = useState("");
  const [documento, setDocumento] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [rol, setRol] = useState<AppRole>(assignableRoles[role as AppRole]?.[0] ?? "delegado");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [credenciales, setCredenciales] = useState<Credenciales | null>(null);
  const [pendientes, setPendientes] = useState<Recuperacion[]>([]);
  const [recuperacionesAbiertas, setRecuperacionesAbiertas] = useState(false);
  const [torneos, setTorneos] = useState<{ id: string; nombre: string; temporada: string }[]>([]);
  const [torneoId, setTorneoId] = useState("");

  const assignable = assignableRoles[role as AppRole] ?? [];
  const cargarPendientes = () => {
    http.get<Recuperacion[]>("/api/recovery/pending").then(({ data }) => setPendientes(data)).catch(() => setPendientes([]));
  };
  useEffect(() => { cargarPendientes(); }, []);
  useEffect(() => {
    http.get<{ id: string; nombre: string; temporada: string; estado: string }[]>("/api/torneos")
      .then(({ data }) => setTorneos(data.filter((t) => t.estado === "ACTIVO")))
      .catch(() => setTorneos([]));
  }, []);

  const cambiarRol = (r: AppRole) => { setRol(r); if (r !== "delegado") setTorneoId(""); };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback("");
    setCredenciales(null);
    setSaving(true);
    try {
      const { data } = await http.post<Credenciales>("/api/usuarios", { nombreCompleto: nombre, documento, correo, telefono, rol, ...(rol === "delegado" ? { torneoId } : {}) });
      setCredenciales(data);
      setNombre(""); setDocumento(""); setCorreo(""); setTelefono("");
    } catch (error) {
      setFeedback(error instanceof AxiosError ? String(error.response?.data?.error ?? "No fue posible crear el usuario") : "Ocurrió un error inesperado");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-5"><h2 className="font-black">Crear nuevo acceso</h2><p className="mt-1 text-sm text-stone-500">Usuario = primer nombre; clave = primer nombre + últimos 3 dígitos del documento.</p></div>
        {feedback && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{feedback}</p>}
        {credenciales && (
          <div className="mb-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4">
            <p className="mb-2 flex items-center gap-2 font-bold text-emerald-800"><KeyRound className="size-4" /> Credenciales generadas</p>
            <p className="text-sm text-emerald-900">Usuario: <b>{credenciales.usuario}</b></p>
            <p className="text-sm text-emerald-900">Clave: <b>{credenciales.clave}</b></p>
            <p className="mt-2 text-xs text-emerald-700">Muéstralas al usuario una sola vez. Puede cambiarla desde el botón Cambiar clave.</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="grid gap-4">
          <Field label="Nombre completo"><Input autoComplete="off" value={nombre} onChange={(e) => setNombre(e.target.value)} required /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cédula / documento"><Input autoComplete="off" inputMode="numeric" value={documento} onChange={(e) => setDocumento(e.target.value)} required /></Field>
            <Field label="Teléfono"><Input autoComplete="off" inputMode="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} required /></Field>
          </div>
          <Field label="Correo"><Input type="email" autoComplete="off" value={correo} onChange={(e) => setCorreo(e.target.value)} required /></Field>
          <Field label="Rol">
            <select value={rol} onChange={(e) => cambiarRol(e.target.value as AppRole)} className="h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm">
              {assignable.map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
            </select>
          </Field>
          {rol === "delegado" && (
            <Field label="Torneo a verificar">
              <select value={torneoId} onChange={(e) => setTorneoId(e.target.value)} className="h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm">
                <option value="">Selecciona un torneo</option>
                {torneos.map((t) => <option key={t.id} value={t.id}>{t.nombre} ({t.temporada})</option>)}
              </select>
            </Field>
          )}
          <Button type="submit" disabled={saving} className="gap-2"><UserPlus className="size-4" />{saving ? "Creando..." : "Crear usuario"}</Button>
        </form>

        <div className="mt-6 border-t pt-5">
          <button type="button" onClick={() => setRecuperacionesAbiertas(!recuperacionesAbiertas)} className="flex w-full items-center justify-between rounded-xl border border-stone-200 px-4 py-3 text-left text-sm font-bold text-stone-700 transition hover:bg-stone-50">
            <span>Recuperaciones pendientes{pendientes.length > 0 && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-800">{pendientes.length}</span>}</span>
            {recuperacionesAbiertas ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
          {recuperacionesAbiertas && (
            <div className="mt-4 grid gap-3">
              {pendientes.length === 0 ? (
                <p className="rounded-xl bg-stone-50 p-4 text-sm text-stone-500">No hay solicitudes de recuperación activas.</p>
              ) : (
                pendientes.map((p) => (
                  <article key={p.id} className="rounded-xl border border-stone-200 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0"><p className="font-bold">{p.nombre}</p><p className="truncate text-sm text-stone-500">{p.usuario} · {p.telefono}</p></div>
                      <p className="rounded-xl bg-amber-100 px-3 py-1 font-mono text-lg font-black tracking-widest text-amber-800">{p.codigo}</p>
                    </div>
                    <p className="mt-2 text-xs text-stone-400">Vence el {new Date(p.expiresAt).toLocaleString()}</p>
                  </article>
                ))
              )}
              <Button variant="outline" size="sm" className="justify-self-start gap-2" onClick={cargarPendientes}><RefreshCw className="size-3.5" />Actualizar</Button>
            </div>
          )}
        </div>
      </div>

      <UsuariosManager />
    </section>
  );
}