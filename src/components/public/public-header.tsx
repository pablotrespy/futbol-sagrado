// Fase 5: cabecera compartida de la consulta pública.
import Image from "next/image";
import Link from "next/link";
import { SalirPublico } from "./salir-publico";
export function PublicHeader(){return <header className="sticky top-0 z-40 border-b border-white/10 bg-stone-950 text-white"><div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-7"><Link href="/" className="flex items-center gap-3"><Image src="/escudo-sagrado-corazon.png" alt="Escudo Sagrado Corazón de Jesús" width={48} height={48} priority className="size-12 rounded-full object-contain" /><div><b>Torneo de Fútbol</b><p className="text-xs text-stone-400">Sagrado Corazón de Jesús</p></div></Link><nav className="flex gap-4 text-sm"><SalirPublico /><Link href="/acceso" className="text-stone-400 hover:text-white">Delegados</Link></nav></div></header>}
