// Fase 1 / módulo 2: contrato Zod compartido para jugadores.
import { z } from "zod";

export const jugadorSchema = z.object({
  nombres: z.string().trim().min(2, "Ingresa los nombres").max(80),
  apellidos: z.string().trim().min(2, "Ingresa los apellidos").max(80),
  documento: z.string().trim().max(30).optional().or(z.literal("")),
  fechaNacimiento: z.iso.date().optional().or(z.literal("")),
  numeroCamiseta: z.number().int().min(1).max(999).nullable().optional(),
  posicion: z.string().trim().max(40).optional().or(z.literal("")),
  vinculo: z.string().trim().max(50).optional().or(z.literal("")),
  equipoId: z.string().min(1, "Selecciona un equipo"),
  activo: z.boolean(),
});

export type JugadorInput = z.infer<typeof jugadorSchema>;
