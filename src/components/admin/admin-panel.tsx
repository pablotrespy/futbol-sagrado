// Fase 1 / módulos 1, 2 y 11: navegación y composición del panel CRUD.
// Selector global "Torneo en curso": enmarca Canchas (compartidas), Equipos/Jugadores,
// Programación, Mesa y Amonestados dentro del torneo elegido.
"use client";

import { CalendarDays, ChevronDown, ClipboardList, LogOut, MapPin, Megaphone, Menu, ShieldAlert, UserPlus, Users } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { http } from "@/lib/http";
import { ordenarPorTemporada } from "@/lib/torneos";
import { Button } from "@/components/ui/button";
import { CanchasManager } from "./canchas-manager";
import { JugadoresManager } from "./jugadores-manager";
import { CrearNuevosManager } from "./crear-nuevos-manager";
import { ProgramacionManager } from "./programacion-manager";
import { MotorJuegoManager } from "./motor-juego-manager";
import { ContenidoManager } from "./contenido-manager";
import { ComunicadosManager } from "./comunicados-manager";
import { SancionesManager } from "./sanciones-manager";
import { CambiarClave } from "@/components/cambiar-clave";
import { ManualAdmin } from "./manual-admin";

type Tab = "canchas" | "jugadores" | "programacion" | "motor" | "contenido" | "comunicados" | "amonestaciones" | "crear";
type Torneo = { id: string; nombre: string; temporada: string; estado: "BORRADOR" | "ACTIVO" | "FINALIZADO" };
const baseTabs = [{ id: "canchas", label: "Canchas / OMesa / Árbitros", icon: MapPin }, { id: "jugadores", label: "Equipos / Jugadores", icon: Users }, { id: "programacion", label: "Programación", icon: CalendarDays }, { id: "motor", label: "Mesa", icon: ClipboardList }, { id: "comunicados", label: "Comunicados", icon: Megaphone }, { id: "amonestaciones", label: "Amonestados", icon: ShieldAlert }] as const;

export function AdminPanel({ user }: { user: { name: string; role: string } }) {
  const router = useRouter();
  const tabs = user.role === "operador_de_mesa"
    ? [{ id: "motor" as const, label: "Mesa", icon: ClipboardList }]
    : user.role === "admin" || user.role === "supervisor"
      ? [...baseTabs, { id: "crear" as const, label: "Crear Usuarios", icon: UserPlus }]
      : [...baseTabs];
  const [tab, setTab] = useState<Tab>(tabs[0].id);
  const [menuMobile, setMenuMobile] = useState(false);
  const [torneos, setTorneos] = useState<Torneo[]>([]);
  const [torneoEnCurso, setTorneoEnCurso] = useState("");

  useEffect(() => {
    let active = true;
    http.get<Torneo[]>("/api/torneos").then(({ data }) => {
      if (!active) return;
      const activos = ordenarPorTemporada(data).filter((t) => t.estado === "ACTIVO");
      setTorneos(activos);
      setTorneoEnCurso(activos[0]?.id ?? "");
    }).catch(() => { if (active) setTorneos([]); });
    return () => { active = false; };
  }, []);

  const navItemClass = (esActivo: boolean) => `flex min-w-max items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${esActivo ? "bg-red-800 text-white" : "text-stone-500 hover:bg-stone-50"}`;
  const torneoSelector = torneos.length > 0 && (
    <label className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5">
      <span className="hidden text-xs text-stone-300 md:inline">Torneos</span>
      <select value={torneoEnCurso} onChange={(e) => setTorneoEnCurso(e.target.value)} className="max-w-32 rounded-md border border-white/20 bg-stone-950 px-2 py-1 text-sm font-semibold text-white sm:max-w-none">
        {torneos.map((t) => <option key={t.id} value={t.id}>{t.nombre} ({t.temporada})</option>)}
      </select>
    </label>
  );

  return <main className="min-h-screen bg-stone-100 text-stone-900">
    <header className="sticky top-0 z-40 bg-stone-950 text-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 sm:px-7"><div className="flex items-center gap-3"><Image src="/logo-colegio-nuevo.jpg" alt="Escudo Sagrado Corazón de Jesús" width={48} height={48} priority className="size-12 rounded-full object-contain" /><div><p className="font-black">Torneo de Futbol</p><p className="hidden text-xs text-stone-400 sm:block">Panel administrativo</p></div></div><div className="flex flex-wrap items-center gap-x-3 gap-y-2">{torneoSelector}<ManualAdmin /><CambiarClave className="text-white hover:bg-white/10" /><div className="hidden text-right sm:block"><p className="text-sm font-semibold">{user.name}</p><p className="text-xs capitalize text-amber-300">{user.role.replaceAll("_", " ")}</p></div><Button variant="ghost" className="text-white hover:bg-white/10" onClick={async () => { await signOut(); router.push("/acceso"); router.refresh(); }}><LogOut className="size-4" />Salir</Button></div></div></header>
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-7 sm:py-9">
      <div className="mb-3 sm:hidden"><button type="button" onClick={() => setMenuMobile((v) => !v)} className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-semibold shadow-sm" aria-expanded={menuMobile}><span className="flex items-center gap-2"><Menu className="size-5" />Menú de secciones</span><ChevronDown className={`size-4 transition-transform ${menuMobile ? "rotate-180" : ""}`} /></button>{menuMobile && <div className="mt-2 grid gap-1 rounded-2xl bg-white p-2 shadow-sm">{tabs.map((t) => { const Icon = t.icon; return <button key={t.id} type="button" onClick={() => { setTab(t.id); setMenuMobile(false); }} className={`${navItemClass(tab === t.id)} w-full`}><Icon className="size-4" />{t.label}</button>; })}</div>}</div>
      <nav className="z-30 mb-6 hidden flex-wrap gap-2 rounded-2xl bg-white p-2 shadow-sm sm:flex sm:sticky sm:top-20">{tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className={navItemClass(tab === id)}><Icon className="size-4" />{label}</button>)}</nav>
      {tab === "canchas" && <CanchasManager />}{tab === "jugadores" && <JugadoresManager torneoId={torneoEnCurso} />}{tab === "programacion" && <ProgramacionManager canCreateTournament={user.role === "admin"} role={user.role} torneoId={torneoEnCurso} />}{tab === "motor" && <MotorJuegoManager role={user.role} torneoId={torneoEnCurso} />}{tab === "contenido" && <ContenidoManager canPublish={user.role === "admin" || user.role === "supervisor"}/>} {tab === "comunicados" && <ComunicadosManager torneoId={torneoEnCurso} />} {tab === "amonestaciones" && <SancionesManager torneoId={torneoEnCurso} />} {tab === "crear" && (user.role === "admin" || user.role === "supervisor") && <CrearNuevosManager role={user.role} />}
    </div>
  </main>;
}