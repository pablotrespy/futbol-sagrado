// Fase 1 / módulo 2: contrato Zod compartido para equipos.
import { z } from "zod";

export const equipoSchema = z.object({
  torneoId: z.string().min(1, "Selecciona el torneo"),
  nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(80),
  color: z.string().trim().max(40).optional().or(z.literal("")),
  activo: z.boolean(),
});

export type EquipoInput = z.infer<typeof equipoSchema>;
