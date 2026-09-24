// Fase 1: respuestas HTTP consistentes para validación, permisos y conflictos.
import { ZodError } from "zod";

export function apiError(error: unknown) {
  if (error instanceof ZodError) {
    return Response.json({ error: "Datos inválidos", fields: error.flatten().fieldErrors }, { status: 422 });
  }
  if (error instanceof Error && error.message === "UNAUTHENTICATED") {
    return Response.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return Response.json({ error: "No tienes permiso para esta acción" }, { status: 403 });
  }
  if (error instanceof Error && error.message.startsWith("CONFLICT:")) {
    return Response.json({ error: error.message.slice(9) }, { status: 409 });
  }
  if (error instanceof Error && error.message === "NOT_FOUND") {
    return Response.json({ error: "El registro solicitado no existe" }, { status: 404 });
  }
  if (error instanceof Error && error.message.startsWith("BAD_REQUEST:")) {
    return Response.json({ error: error.message.slice(12) }, { status: 400 });
  }
  if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
    return Response.json({ error: "Ya existe un registro con esos datos" }, { status: 409 });
  }
  if (typeof error === "object" && error && "code" in error && error.code === "P2003") {
    return Response.json({ error: "El registro está siendo utilizado y no puede eliminarse" }, { status: 409 });
  }
  return Response.json({ error: "No fue posible completar la operación" }, { status: 500 });
}
