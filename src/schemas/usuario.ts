// Fase 1 / módulo 11: contratos para alta de usuarios y recuperación de clave.
import { z } from "zod";
import { roles } from "@/lib/access-policy";

export const userRoleSchema = z.object({ role: z.enum(roles) });

export const crearUsuarioSchema = z.object({
  nombreCompleto: z.string().trim().min(3, "Escribe el nombre completo").max(120),
  documento: z.string().trim().min(5, "Escribe la cédula / documento").max(20),
  correo: z.email("Escribe un correo válido").max(120),
  telefono: z.string().trim().min(7, "Escribe el teléfono").max(20),
  rol: z.enum(roles),
  torneoId: z.string().trim().max(60).optional(),
});

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;

export const asignarTorneoDelegadoSchema = z.object({ torneoId: z.string().trim().max(60).nullable() });

export const recoveryRequestSchema = z.object({ telefono: z.string().trim().min(7, "Escribe el teléfono").max(20) });
export const recoveryConfirmSchema = z.object({
  telefono: z.string().trim().min(7, "Escribe el teléfono").max(20),
  codigo: z.string().trim().regex(/^\d{6}$/, "El código tiene 6 dígitos"),
  nuevaClave: z.string().min(8, "La clave debe tener al menos 8 caracteres").max(72),
});
export const cambiarClaveSchema = z.object({
  claveActual: z.string().min(1, "Ingresa tu clave actual"),
  nuevaClave: z.string().min(8, "La clave debe tener al menos 8 caracteres").max(72),
});
