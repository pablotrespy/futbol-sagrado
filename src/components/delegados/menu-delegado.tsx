"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { ManualDelegado } from "@/components/delegados/manual-delegado";
import { CambiarClave } from "@/components/cambiar-clave";

export function MenuDelegado() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);

  const salir = async () => {
    setAbierto(false);
    await signOut();
    router.push("/campeonato");
    router.refresh();
  };

  return (
    <div className="relative sm:hidden">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="rounded-lg p-2 text-white hover:bg-white/10 transition"
        aria-label="Menú"
      >
        {abierto ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      {abierto && (
        <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-stone-200 bg-white p-3 text-stone-900 shadow-xl">
          <div className="grid gap-1">
            <div className="rounded-xl px-2 py-2 hover:bg-stone-100">
              <ManualDelegado className="text-stone-700 hover:text-stone-900" />
            </div>
            <div className="rounded-xl px-2 py-2 hover:bg-stone-100">
              <CambiarClave className="text-stone-700 hover:bg-transparent hover:text-stone-900" />
            </div>
            <button
              type="button"
              onClick={() => void salir()}
              className="flex items-center gap-1.5 rounded-xl px-2 py-2 text-sm text-red-700 hover:bg-red-50 transition"
            >
              <LogOut className="size-4" />
              Salir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
