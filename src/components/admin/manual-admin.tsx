"use client";

import { BookOpen, X } from "lucide-react";
import { useState, useEffect } from "react";
import { SECCIONES_DELEGADO } from "@/components/delegados/manual-delegado";

const SECCIONES_ADMIN = [
  {
    titulo: "1. Roles y permisos",
    contenido: [
      "Admin — Control total: crea torneos, asigna cualquier rol, opera partidos, genera crónicas, gestiona amonestaciones.",
      "Supervisor — Mismo alcance que admin, excepto: NO puede crear torneos; al crear usuarios solo asigna operador o delegado.",
      "Operador de mesa — Solo pestaña «Mesa»: opera partidos en vivo. No ve multas ni gestiona usuarios.",
      "Delegado — Ingresa a «Delegados»: ve su planilla de amonestados con montos a pagar (solo lectura).",
      "Público — Sin sesión: ve calendario, posiciones, goleadores, amonestados y perfiles.",
    ],
  },
  {
    titulo: "2. Acceso inicial",
    contenido: [
      "El sistema se entrega con un único usuario admin predeterminado, creado por el desarrollador durante la instalación.",
      "Ingrese con ese admin para iniciar la configuración y crear el usuario supervisor desde «Crear Usuarios».",
      "El supervisor completa los accesos de operadores de mesa y delegados.",
    ],
  },
  {
    titulo: "3. Canchas",
    contenido: [
      "Registra las canchas del campeonato: nombre (único), ubicación y descripción (opcionales).",
      "Activa/desactiva canchas con el interruptor. Las inactivas no aparecen al programar partidos.",
    ],
  },
  {
    titulo: "4. Equipos / Jugadores",
    contenido: [
      "Importar desde Excel: un archivo .xlsx con una hoja por equipo. Nombre de hoja = nombre del equipo.",
      "Columnas: Nombres (obligatorio), Apellidos (obligatorio), Cédula, Fecha nacimiento, Número camiseta.",
      "La importación reemplaza la plantilla completa: jugadores que no están en el Excel se desactivan (no se borran).",
      "Puede exportar la plantilla actual a Excel desde el botón «Exportar».",
    ],
  },
  {
    titulo: "5. Programación",
    contenido: [
      "Paso 1 — Crear torneo: nombre, temporada. Solo el admin puede crear torneos. Actívelo con el interruptor cuando esté listo.",
      "Paso 2 — Crear jornadas: nombre (ej: «Fecha 1») y fecha del día de juego.",
      "Paso 3 — Programar partidos: automático (round robin, sin cruces) o manual (equipo local, visitante, cancha, hora).",
    ],
  },
  {
    titulo: "6. Mesa de control",
    contenido: [
      "Operador de mesa ingresa → ve solo la pestaña «Mesa». Selecciona un partido del desplegable.",
      "Registra: Operador (nombre/apellido), Árbitro (nombre/apellido), alineaciones, goles y tarjetas.",
      "Jugadores sancionados aparecen en rojo y NO pueden ser alineados (checkbox deshabilitado).",
      "El reloj avanza solo: Primer tiempo (00:00→39:59), Entretiempo (10:00→00:01), Segundo tiempo (40:00→79:59).",
      "«Finalizar acta» se habilita a los 80:00 del segundo tiempo. Al finalizar, se recalculan posiciones y goleadores.",
      "Guarde avance frecuentemente — los datos no se guardan solos.",
    ],
  },
  {
    titulo: "7. Crónicas",
    contenido: [
      "La pestaña de crónicas está oculta en el panel; su funcionalidad se mantiene internamente.",
      "El flujo de generación y publicación requiere revisión y aprobación humana previa.",
    ],
  },
  {
    titulo: "7b. Comunicados",
    contenido: [
      "Admin y supervisor cargan comunicados del torneo en PDF: escriben el número de resolución y la fecha.",
      "El PDF se guarda en disco y se publica en el portal para consulta de todos (solo lectura).",
      "Puede editar resolución/fecha e incluso reemplazar el PDF desde el botón de edición.",
    ],
  },
  {
    titulo: "8. Amonestados",
    contenido: [
      "Agrupa las tarjetas por jugador y partido (máximo 3 tarjetas por jugador por partido) mostrando combinación, sanción y multa.",
      "Multas: Amarilla $15.000 | Azul $25.000 | Roja $40.000. Multa = suma de las tarjetas.",
      "Combinaciones: 2 amarillas → 1 fecha · Azul → 2 fechas · Roja → 3 fechas · +/-Azul → 2 fechas · +Roja → 3 fechas · Azul+Roja → 5 fechas · Amarilla+Azul+Roja → suspendido del torneo.",
      "Haga clic en «Pagar» para registrar pago y activar la sanción (cuenta desde la jornada siguiente). Las amarillas SOLO generan multa.",
      "La sanción queda activa mientras cumple fechas; al agotarse pasa al histórico automáticamente. Suspensiones indefinidas se pueden revocar.",
    ],
  },
  {
    titulo: "9. Crear usuarios",
    contenido: [
      "Ingrese nombre, cédula, teléfono y correo. Seleccione el rol. El sistema genera usuario y contraseña.",
      "Las credenciales se muestran una vez. Si se pierden, solicite recuperación de contraseña.",
      "Los roles NO se pueden cambiar después de creados. Si necesita cambiar un rol, cree un nuevo usuario.",
    ],
  },
  {
    titulo: "10. Portal público",
    contenido: [
      "Calendario (/campeonato): partidos por jornada, reloj en tiempo real, goles con minuto y autor.",
      "Posiciones (/campeonato/posiciones): tabla de posiciones y top 15 goleadores.",
      "Amonestados (/campeonato/amonestaciones): tarjetas de partidos finalizados (excluye pagadas).",
      "Perfiles: clic en nombre de equipo o jugador para ver estadísticas, plantilla e historial.",
    ],
  },
  {
    titulo: "11. Recuperación de contraseña",
    contenido: [
      "En login → «¿Olvidaste tu clave?» → ingrese teléfono → sistema genera código de 6 dígitos.",
      "El admin ve los códigos pendientes en «Crear nuevos» y se lo proporciona al usuario.",
      "El usuario ingresa teléfono, código y nueva contraseña para restablecer.",
    ],
  },
  {
    titulo: "12. Consejos",
    contenido: [
      "Registre todo antes de empezar: canchas, equipos, jugadores y torneo.",
      "Importe jugadores con Excel — es la forma más rápida y segura.",
      "Use programación automática para evitar solapamientos.",
      "Guarde avances frecuentemente en la mesa de control.",
      "No comparta credenciales — cada usuario debe tener su propia cuenta.",
    ],
  },
];

export const MANUALES = [
  { id: "admin", titulo: "Panel administrativo", secciones: SECCIONES_ADMIN },
  { id: "delegados", titulo: "Planilla de delegados", secciones: SECCIONES_DELEGADO },
] as const;

export function ManualAdmin() {
  const [abierto, setAbierto] = useState(false);
  const [manual, setManual] = useState<"admin" | "delegados">("admin");

  useEffect(() => {
    if (!abierto) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [abierto]);

  const actual = MANUALES.find((item) => item.id === manual) ?? MANUALES[0];

  return (
    <>
      <button onClick={() => setAbierto(true)} className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition" title="Manual de uso">
        <BookOpen className="size-4" />
        <span className="hidden sm:inline">Manual</span>
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-[5vh] sm:pt-[8vh]" onClick={() => setAbierto(false)}>
          <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white px-6 py-4 rounded-t-2xl">
              <div>
                <h2 className="text-lg font-black text-stone-900">Manual de uso</h2>
                <p className="text-xs text-stone-500">{actual.titulo}</p>
              </div>
              <button onClick={() => setAbierto(false)} className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition">
                <X className="size-5" />
              </button>
            </div>

            <div className="flex gap-1.5 border-b border-stone-200 bg-stone-50 px-6 py-3">
              {MANUALES.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setManual(item.id)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${manual === item.id ? "bg-red-100 text-red-700 font-bold" : "text-stone-500 hover:bg-stone-100"}`}
                >
                  {item.titulo}
                </button>
              ))}
            </div>

            <div className="px-6 py-5 space-y-5">
              {actual.secciones.map((seccion, i) => (
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
