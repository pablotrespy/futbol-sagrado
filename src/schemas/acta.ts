// Fase 3 / módulo 5: contrato estructurado del acta en vivo.
import { z } from "zod";
const eventoBase = z.object({ jugadorId: z.string().min(1), minuto: z.number().int().min(0).max(180) });
export const actaSchema = z.object({ alineacion: z.array(z.object({ jugadorId: z.string().min(1), titular: z.boolean() })), goles: z.array(eventoBase.extend({ equipoId: z.string().min(1), autogol: z.boolean().default(false) })), tarjetas: z.array(eventoBase.extend({ tipo: z.enum(["AMARILLA", "AZUL", "ROJA"]) })), observaciones: z.string().max(2000).optional().or(z.literal("")), operadorNombre: z.string().max(100).optional().or(z.literal("")), operadorApellido: z.string().max(100).optional().or(z.literal("")), arbitroNombre: z.string().max(100).optional().or(z.literal("")), arbitroApellido: z.string().max(100).optional().or(z.literal("")), finalizar: z.boolean().default(false) });
export type ActaInput = z.infer<typeof actaSchema>;
