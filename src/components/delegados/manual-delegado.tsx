"use client";

import { BookOpen, X } from "lucide-react";
import { useState, useEffect } from "react";

export const SECCIONES_DELEGADO = [
  {
    titulo: "1. Tu rol: Delegado",
    contenido: [
      "El delegado consulta la planilla de amonestados con los montos a pagar por cada jugador de su equipo.",
      "Es una vista de solo lectura: no puedes registrar pagos ni modificar sanciones.",
      "Ves las tarjetas de todos los equipos, así puedes verificar montos y sanciones propias.",
    ],
  },
  {
    titulo: "2. Cómo ingresar",
    contenido: [
      "En el portal público, usa el enlace «Delegados» del encabezado para ir a /acceso.",
      "Inicia sesión con tu usuario (tu primer nombre) y tu contraseña.",
      "Si no recuerdas tu clave, usa la opción de recuperación por teléfono en la pantalla de login.",
    ],
  },
  {
    titulo: "3. La planilla de amonestados",
    contenido: [
      "Lista las tarjetas de partidos ya finalizados, con: jugador, equipo, fecha, partido, tipo de tarjeta y multa ($).",
      "Multas vigentes: Amarilla $15.000 | Azul $25.000 | Roja $40.000.",
      "Una tarjeta amarilla genera SOLO multa económica, no suspende partidos.",
      "Si un jugador además tiene una sanción de suspensión, aparece marcado para que no se alinee.",
    ],
  },
  {
    titulo: "4. Qué debes hacer",
    contenido: [
      "Revisa periódicamente la planilla para conocer los montos pendientes de tu equipo.",
      "Coordina el pago de las multas con la administración del torneo (caja / mesa de control).",
      "Informa a los jugadores sancionados para que no sean alineados en los próximos partidos.",
    ],
  },
  {
    titulo: "5. Cambiar tu contraseña",
    contenido: [
      "Usa el botón «Cambiar clave» del encabezado para actualizar tu contraseña cuando quieras.",
      "No compartas tus credenciales con nadie.",
    ],
  },
  {
    titulo: "6. Consejos",
    contenido: [
      "Ingresa unos días después de cada jornada para revisar nuevas tarjetas y montos.",
      "Antes de cada partido, confirma en la planilla quiénes están sancionados o amarillados.",
      "Si ves datos incorrectos, repórtalo a la mesa de control.",
    ],
  },
];

export function ManualDelegado({ className = "text-white/80 hover:text-white" }: { className?: string }) {
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [abierto]);

  return (
    <>
      <button onClick={() => setAbierto(true)} className={`flex items-center gap-1.5 text-sm transition ${className}`} title="Manual de uso">
        <BookOpen className="size-4" />
        <span className="hidden sm:inline">Manual</span>
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-[5vh] sm:pt-[8vh]" onClick={() => setAbierto(false)}>
          <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white px-6 py-4 rounded-t-2xl">
              <div>
                <h2 className="text-lg font-black text-stone-900">Manual de uso</h2>
                <p className="text-xs text-stone-500">Padres Plus 50 — Planilla de delegados</p>
              </div>
              <button onClick={() => setAbierto(false)} className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition">
                <X className="size-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {SECCIONES_DELEGADO.map((seccion, i) => (
                <div key={i}>
                  <h3 className="mb-2 text-sm font-bold text-red-800">{seccion.titulo}</h3>
                  <ul className="space-y-1.5 pl-1">
                    {seccion.contenido.map((item, j) => (
                      <li key={j} className="text-sm leading-relaxed text-stone-700 before:mr-2 before:text-stone-300 before:content-['▸']">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="border-t border-stone-200 px-6 py-3 text-center">
              <p className="text-xs text-stone-400">Colegio Sagrado Corazón de Jesús — Campeonato Padres Plus 50</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
