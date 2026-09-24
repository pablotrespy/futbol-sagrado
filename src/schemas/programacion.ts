// Fase 2 / módulos 3 y 4: contratos compartidos de torneo, jornada y partidos.
import { z } from "zod";

export const torneoSchema = z.object({ nombre: z.string().trim().min(3).max(100), temporada: z.string().trim().min(2).max(30), estado: z.enum(["BORRADOR", "ACTIVO", "FINALIZADO"]) });
export const jornadaSchema = z.object({ torneoId: z.string().min(1), numero: z.number().int().min(1).max(200), nombre: z.string().trim().min(2).max(80), fecha: z.union([z.iso.date(), z.iso.datetime({ offset: true })]).optional() });
export const partidoManualSchema = z.object({ equipoLocalId: z.string().min(1), equipoVisitanteId: z.string().min(1), canchaId: z.string().min(1), inicio: z.union([z.iso.datetime({ offset: true }), z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)]), duracionMinutos: z.number().int().min(20).max(180), operadorId: z.string().max(100).optional().or(z.literal("")), arbitroId: z.string().max(100).optional().or(z.literal("")) }).refine((value) => value.equipoLocalId !== value.equipoVisitanteId, { message: "Un equipo no puede jugar contra sí mismo", path: ["equipoVisitanteId"] });
export const diaProgramacionSchema = z.object({ fecha: z.iso.date(), horaInicio: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/) });
export const asignacionDiaSchema = z.object({ operadorId: z.string().max(100).optional().or(z.literal("")), arbitroId: z.string().max(100).optional().or(z.literal("")) });
export const canchaProgramadaSchema = z.object({ canchaId: z.string().min(1), dias: z.array(asignacionDiaSchema).min(1) });
export const autoProgramacionSchema = z.object({ modo: z.literal("auto"), canchas: z.array(canchaProgramadaSchema).min(1), dias: z.array(diaProgramacionSchema).min(1).max(30), duracionMinutos: z.number().int().min(20).max(180), intervaloMinutos: z.number().int().min(0).max(120) });
export const manualProgramacionSchema = z.object({ modo: z.literal("manual"), partidos: z.array(partidoManualSchema).min(1).max(30) });
export const programarFechaSchema = z.discriminatedUnion("modo", [autoProgramacionSchema, manualProgramacionSchema]);
export const actualizarPartidoSchema = partidoManualSchema.extend({ estado: z.enum(["PROGRAMADO", "EN_CURSO", "SUSPENDIDO", "CANCELADO"]).optional() });
export const cambiarEstadoPartidoSchema = z.object({ estado: z.enum(["PROGRAMADO", "EN_CURSO", "SUSPENDIDO", "CANCELADO"]) });

export type PartidoManualInput = z.infer<typeof partidoManualSchema>;
