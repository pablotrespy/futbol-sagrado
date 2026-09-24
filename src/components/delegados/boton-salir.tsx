"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function BotonSalir() {
  const router = useRouter();
  return (
    <Button
      type="button"
      className="rounded-xl border border-red-700 bg-red-700 px-4 py-2 font-bold text-white transition hover:bg-red-800"
      onClick={async () => {
        await signOut();
        router.push("/campeonato");
        router.refresh();
      }}
    >
      <LogOut className="size-4" />
      Salir
    </Button>
  );
}
