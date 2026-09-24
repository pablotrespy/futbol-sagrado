// Contrato Zod compartido para comunicados del torneo.
import { z } from "zod";

export const comunicadoSchema = z.object({
  resolucion: z.string().trim().min(1, "Escribe el número de resolución").max(80),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (usa AAAA-MM-DD)").transform((valor) => new Date(`${valor}T12:00:00.000Z`)),
});

export type ComunicadoInput = z.infer<typeof comunicadoSchema>;