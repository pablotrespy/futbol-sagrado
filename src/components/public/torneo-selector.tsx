// Selector de torneo (dropdown de dos líneas: nombre + temporada) para el portal público.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

type Torneo = { id: string; nombre: string; temporada: string };

export function TorneoSelector({ tournaments, selectedId, basePath, onSelect }: {
  tournaments: Torneo[];
  selectedId: string;
  basePath: string;
  onSelect?: (id: string) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const selected = tournaments.find((t) => t.id === selectedId);

  const elegir = (id: string) => {
    setOpen(false);
    if (onSelect) { onSelect(id); return; }
    router.push(`${basePath}?torneo=${id}`);
    router.refresh();
  };

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex min-w-[170px] items-center justify-between gap-2 rounded-lg border bg-white px-3 py-1.5 text-left">
        <span>
          <span className="block text-xs font-semibold leading-tight text-stone-800">{selected?.nombre ?? "Escoger Torneo"}</span>
          {selected && <span className="block text-[10px] leading-tight text-stone-500">{selected.temporada}</span>}
        </span>
        <ChevronDown className="size-4 shrink-0 text-stone-400" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 max-h-64 w-56 overflow-auto rounded-xl border border-stone-200 bg-white p-1 shadow-xl">
          {tournaments.length === 0 && <p className="px-3 py-2 text-xs text-stone-400">Sin torneos</p>}
          {tournaments.map((t) => (
            <button key={t.id} type="button" onClick={() => elegir(t.id)} className={`flex w-full flex-col rounded-lg px-3 py-1.5 text-left hover:bg-stone-100 ${t.id === selectedId ? "bg-red-50" : ""}`}>
              <span className="text-xs font-semibold text-stone-800">{t.nombre}</span>
              <span className="text-[10px] text-stone-500">{t.temporada}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
