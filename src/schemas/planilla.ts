// Contrato Zod compartido para formatos de planillas (Operador de mesa / Árbitro).
import { z } from "zod";

export const tipoPlanillaSchema = z.enum(["OPERADOR_MESA", "ARBITRO", "EQUIPOS_JUGADORES", "EQUIPOS", "JUGADORES"]);
export type TipoPlanilla = z.infer<typeof tipoPlanillaSchema>;

export const ETIQUETA_PLANILLA: Record<TipoPlanilla, string> = {
  OPERADOR_MESA: "Planilla Operador de Mesa",
  ARBITRO: "Planilla Árbitro",
  EQUIPOS_JUGADORES: "Formato Equipos/Jugadores",
  EQUIPOS: "Formato de Equipos",
  JUGADORES: "Formato Jugadores por Equipos",
};
