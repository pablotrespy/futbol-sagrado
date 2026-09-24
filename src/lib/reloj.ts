// Fase 5+: cronología de estados del partido derivada de la hora programada o del origen recalibrado en mesa de control.
export const MINUTOS_PRIMER_TIEMPO = 40;
export const MINUTOS_DESCANSO = 10;
export const MINUTOS_SEGUNDO_TIEMPO = 40;

export type FaseManual = "PRIMER_TIEMPO" | "ENTRETIEMPO" | "SEGUNDO_TIEMPO";
export type FasePartido = "PREVIO" | FaseManual | "FINALIZADO";
export type RelojPartido = { fase: FasePartido; etiqueta: string; segundos: number | null };

const LIMITE_PRIMER_TIEMPO = MINUTOS_PRIMER_TIEMPO * 60;
const FIN_ENTRETIEMPO = (MINUTOS_PRIMER_TIEMPO + MINUTOS_DESCANSO) * 60;
const FIN_PARTIDO = (MINUTOS_PRIMER_TIEMPO + MINUTOS_DESCANSO + MINUTOS_SEGUNDO_TIEMPO) * 60;
const DESFASE_SEGUNDO_TIEMPO = FIN_ENTRETIEMPO - LIMITE_PRIMER_TIEMPO;

// Límites de minutos al forzar cada fase, para que el origen virtual caiga dentro de su ventana.
export const LIMITES_MINUTOS: Record<FaseManual, [number, number]> = {
  PRIMER_TIEMPO: [0, MINUTOS_PRIMER_TIEMPO],
  ENTRETIEMPO: [0, MINUTOS_DESCANSO],
  SEGUNDO_TIEMPO: [0, MINUTOS_SEGUNDO_TIEMPO + 39],
};

// Convierte "forzar fase X en el minuto m" en el origen de la línea de tiempo automática.
// En ENTRETIEMPO los minutos son los restantes del descanso (10:00 → 00:00).
export function origenVirtual(fase: FaseManual, minutos: number, ahora: Date): Date {
  const offset = fase === "PRIMER_TIEMPO" ? minutos * 60 : fase === "ENTRETIEMPO" ? LIMITE_PRIMER_TIEMPO + (MINUTOS_DESCANSO - minutos) * 60 : DESFASE_SEGUNDO_TIEMPO + minutos * 60;
  return new Date(ahora.getTime() - offset * 1000);
}

export function faseDePartido(
  partido: { inicio: string | Date; inicioEfectivo?: string | Date | null; estado: string },
  ahora: Date
): RelojPartido {
  if (partido.estado === "FINALIZADO") return { fase: "FINALIZADO", etiqueta: "FIN", segundos: null };
  const transcurrido = Math.floor((ahora.getTime() - new Date(partido.inicioEfectivo ?? partido.inicio).getTime()) / 1000);
  if (transcurrido < 0) return { fase: "PREVIO", etiqueta: "", segundos: null };
  if (transcurrido < LIMITE_PRIMER_TIEMPO) return { fase: "PRIMER_TIEMPO", etiqueta: "EN JUEGO", segundos: transcurrido };
  if (transcurrido < FIN_ENTRETIEMPO) return { fase: "ENTRETIEMPO", etiqueta: "ENTRETIEMPO", segundos: FIN_ENTRETIEMPO - transcurrido };
  if (transcurrido < FIN_PARTIDO) return { fase: "SEGUNDO_TIEMPO", etiqueta: "EN JUEGO", segundos: transcurrido - DESFASE_SEGUNDO_TIEMPO };
  return { fase: "FINALIZADO", etiqueta: "FIN", segundos: null };
}

export function formatoReloj(totalSegundos: number): string {
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;
  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

// Minuto del cronómetro (segundo tiempo 40:00 → 80:00) desde el cual la mesa puede finalizar el acta.
export const MINUTO_FINALIZACION = MINUTOS_PRIMER_TIEMPO * 2;

// El botón Finalizar solo se habilita cuando el reloj público llega a 80:00 o el partido ya terminó.
export function puedeFinalizarActa(reloj: RelojPartido): boolean {
  return reloj.fase === "FINALIZADO" || (reloj.fase === "SEGUNDO_TIEMPO" && (reloj.segundos ?? 0) >= MINUTO_FINALIZACION * 60);
}
