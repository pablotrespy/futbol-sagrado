"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function SalirPublico() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <button
      type="button"
      title="Salir al inicio"
      className={`flex items-center gap-1.5 text-sm transition hover:text-white ${session ? "text-amber-200" : "text-stone-400"}`}
      onClick={async () => {
        if (session) await signOut();
        router.push("/");
        router.refresh();
      }}
    >
      Salir
    </button>
  );
}
