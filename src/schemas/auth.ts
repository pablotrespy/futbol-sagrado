// Fase 0 / módulo 11: validación compartida de formularios de acceso.
import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Escribe un correo válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export type SignInInput = z.infer<typeof signInSchema>;
