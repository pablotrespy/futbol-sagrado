// Fase 0: portada responsive que expone la base funcional del producto.
import { CalendarDays, ShieldCheck, Trophy, Users } from "lucide-react";
import Image from "next/image";

const modules = [
  { icon: CalendarDays, title: "Programación", copy: "Fechas, canchas y horarios sin cruces." },
  { icon: Users, title: "Equipos", copy: "Planteles y perfiles en un solo lugar." },
  { icon: Trophy, title: "Competencia", copy: "Resultados y posiciones actualizados." },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-stone-950 text-stone-50">
      <Image src="/fondo-cancha-nocturna.jpg" alt="Cancha de fútbol iluminada de noche" fill priority className="object-cover object-center" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,8,8,.92),rgba(8,8,8,.62)),linear-gradient(180deg,rgba(8,8,8,.35),rgba(8,8,8,.88))]" />
      <section className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <Image src="/escudo-sagrado-corazon.png" alt="Escudo del Colegio del Sagrado Corazón" width={48} height={48} priority className="size-12 rounded-full object-contain" />
            <div><p className="font-semibold tracking-wide">Campeonato de Fútbol</p><p className="text-xs text-stone-400">Sagrado Corazón de Jesús</p></div>
          </div>
          <a href="/acceso" className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-200"><ShieldCheck className="size-4" /> Acceso a plataforma</a>
        </header>
        <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-amber-300">La cancha también se organiza</p>
            <h1 className="max-w-3xl text-5xl font-black leading-[.95] tracking-tight sm:text-7xl">El campeonato, <span className="text-red-400">en un solo equipo.</span></h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-stone-300 sm:text-lg">Gestión deportiva, actas en vivo y consulta pública para vivir cada fecha con menos papeleo y más fútbol.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="/campeonato" className="rounded-full bg-red-700 px-6 py-3 text-sm font-bold shadow-lg shadow-red-950 transition hover:bg-red-600">Ver campeonato</a>
              <span className="rounded-full border border-white/15 px-6 py-3 text-sm text-stone-300">Mobile-first · Web responsive</span>
            </div>
          </div>
          <div id="modulos" className="grid gap-3">
            {modules.map(({ icon: Icon, title, copy }, index) => (
              <article key={title} className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.045] p-5 backdrop-blur transition hover:border-amber-300/30 hover:bg-white/[.07]">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-red-900/70 text-amber-200"><Icon className="size-5" /></span>
                <div className="flex-1"><h2 className="font-bold">{title}</h2><p className="mt-1 text-sm text-stone-400">{copy}</p></div>
                <span className="text-xs font-bold text-stone-600">0{index + 1}</span>
              </article>
            ))}
          </div>
        </div>
        <footer className="border-t border-white/10 pt-5 text-xs text-stone-500">Colegio Sagrado Corazón de Jesús · Campeonato Padres Plus 50</footer>
      </section>
    </main>
  );
}
