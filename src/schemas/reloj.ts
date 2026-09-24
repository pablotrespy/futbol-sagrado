// Fase 5+: contrato del cambio de estado manual con recalibración del reloj.
import { z } from "zod";
import { LIMITES_MINUTOS, type FaseManual } from "@/lib/reloj";

const FASES = ["PRIMER_TIEMPO", "ENTRETIEMPO", "SEGUNDO_TIEMPO"] as const;

export const cambioEstadoSchema = z
  .object({
    restaurar: z.boolean().default(false),
    fase: z.enum(FASES).optional(),
    minutos: z.number().int().optional(),
  })
  .superRefine((valor, ctx) => {
    if (valor.restaurar) return;
    if (!valor.fase || valor.minutos === undefined) {
      ctx.addIssue({ code: "custom", message: "Indica la fase y los minutos para forzar el cambio." });
      return;
    }
    const [minimo, maximo] = LIMITES_MINUTOS[valor.fase as FaseManual];
    if (valor.minutos < minimo || valor.minutos > maximo) {
      ctx.addIssue({ code: "custom", message: `Minutos permitidos para ${valor.fase}: ${minimo} a ${maximo}.` });
    }
  });

export type CambioEstadoInput = z.infer<typeof cambioEstadoSchema>;
