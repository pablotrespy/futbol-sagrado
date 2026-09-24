"use client";

import { useSession, signOut } from "@/lib/auth-client";

export function SalirPublico() {
  const { data: session } = useSession();

  return (
    <button
      type="button"
      title={session ? "Cerrar sesión" : "Cerrar"}
      className={`flex items-center gap-1.5 text-sm transition hover:text-white ${session ? "text-amber-200" : "text-stone-400"}`}
      onClick={async () => {
        if (session) await signOut();
      }}
    >
      Cerrar
    </button>
  );
}