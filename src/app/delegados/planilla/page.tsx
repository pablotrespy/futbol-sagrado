// Planilla de amonestados para delegados: acceso exclusivo con rol delegado.
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SancionesManager } from "@/components/admin/sanciones-manager";
import { MenuDelegado } from "@/components/delegados/menu-delegado";
import { BotonSalir } from "@/components/delegados/boton-salir";

export default async function PlanillaDelegadoPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/acceso");
  if (String(session.user.role) !== "delegado") redirect("/");

  const torneoId = (session.user as { torneoId?: string | null }).torneoId ?? "";
  const torneo = torneoId ? await prisma.torneo.findUnique({ where: { id: torneoId }, select: { nombre: true } }) : null;
  if (!torneoId || !torneo) {
    return (
      <main className="min-h-screen bg-stone-100 text-stone-900">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-7">
          <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
            <h1 className="text-lg font-bold">Sin torneo asignado</h1>
            <p className="mt-2 text-sm text-stone-500">Tu acceso aún no tiene un torneo asignado. Contacta al organizador para que te lo asigne.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-stone-100 text-stone-900">
      <header className="sticky top-0 z-40 bg-stone-950 text-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-7">
          <div>
            <p className="font-black">Torneo de Futbol</p>
            <p className="text-xs text-stone-400">Delegados · {torneo.nombre}</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-right sm:block">
              <p className="font-semibold">{session.user.name}</p>
              <p className="text-xs capitalize text-amber-300">delegado</p>
            </span>
            <MenuDelegado />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-7 sm:py-9">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-base font-black">Planilla de amonestados</h1>
            <p className="mt-1 text-sm text-stone-500">{torneo.nombre}</p>
          </div>
          <div className="hidden sm:block">
            <BotonSalir />
          </div>
        </div>
        <SancionesManager readOnly torneoId={torneoId} />
      </div>
    </main>
  );
}
