// Fase 0: portada responsive que expone la base funcional del producto.
import { ShieldCheck } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-stone-950 text-stone-50">
      <Image src="/fondo-cancha-nocturna.jpg" alt="Cancha de fútbol iluminada de noche" fill priority className="object-cover object-center" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,8,8,.68),rgba(8,8,8,.28)),linear-gradient(180deg,rgba(8,8,8,.18),rgba(8,8,8,.62))]" />
      <section className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <Image src="/escudo-sagrado-corazon.png" alt="Escudo del Colegio del Sagrado Corazón" width={48} height={48} priority className="size-12 rounded-full object-contain" />
            <div><p className="font-semibold tracking-wide">Campeonato de Fútbol</p><p className="text-xs text-stone-400">Sagrado Corazón de Jesús</p></div>
          </div>
          <a href="/acceso" className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-200"><ShieldCheck className="size-4" /> Acceso a plataforma</a>
        </header>
        <div className="flex flex-1 items-center py-16">
          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-amber-300">La cancha también se organiza</p>
            <h1 className="max-w-3xl text-5xl font-black leading-[.95] tracking-tight sm:text-7xl">Fútbol, <span className="text-red-400">amistad y comunidad.</span></h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-stone-300 sm:text-lg">Un espacio de recreación y sana convivencia para que los padres de familia compartan, disfruten del deporte y fortalezcan los lazos de nuestra comunidad corazonista.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="/campeonato" className="rounded-full bg-red-700 px-6 py-3 text-sm font-bold shadow-lg shadow-red-950 transition hover:bg-red-600">Consultar información</a>
              <span className="rounded-full border border-white/15 px-6 py-3 text-sm text-stone-300">Mobile-first · Web responsive</span>
            </div>
          </div>
        </div>
        <footer className="border-t border-white/10 pt-5 text-xs text-stone-500">Colegio Sagrado Corazón de Jesús · Campeonato Padres Plus 50</footer>
      </section>
    </main>
  );
}
