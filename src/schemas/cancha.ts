// Fase 1 / módulo 1: contrato Zod compartido para configurar canchas.
import { z } from "zod";

export const canchaSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(80),
  ubicacion: z.string().trim().max(160).optional().or(z.literal("")),
  descripcion: z.string().trim().max(300).optional().or(z.literal("")),
  activa: z.boolean(),
});

export type CanchaInput = z.infer<typeof canchaSchema>;
