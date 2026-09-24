import { z } from "zod";
import { CODIGOS_TARJETA } from "@/lib/reglamento";
export const TARJETAS_OPTIONS = CODIGOS_TARJETA;
export type TarjetaOption = (typeof TARJETAS_OPTIONS)[number];
export const sancionSchema = z.object({
  jugadorId: z.string().min(1),
  torneoId: z.string().min(1),
  partidoId: z.string().min(1).optional(),
  motivo: z.string().trim().max(300).optional().default(""),
  tarjeta: z.enum(TARJETAS_OPTIONS).optional(),
  jornadaInicioNumero: z.number().int().min(1),
  duracionFechas: z.number().int().min(0).max(100).nullable().optional(),
  indefinida: z.boolean().default(false),
  valorPagar: z.number().int().min(0).nullable().optional(),
  estadoPago: z.enum(["PENDIENTE", "PAGADA"]).optional(),
});