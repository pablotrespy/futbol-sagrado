// Fase 4 / módulos 8 y 9: contratos editoriales y de publicación.
import { z } from "zod";
export const editarCronicaSchema=z.object({titulo:z.string().trim().min(5).max(140),texto:z.string().trim().min(80).max(8000),aprobar:z.boolean()});
export const publicarCronicaSchema=z.object({canales:z.array(z.enum(["X","INSTAGRAM"])).min(1)});
