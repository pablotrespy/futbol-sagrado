// Fase 4 / módulo 8: bandeja editorial de partidos finalizados.
import {apiError} from "@/lib/api";import{prisma}from"@/lib/prisma";import{requirePermission}from"@/lib/rbac";
export async function GET(){try{await requirePermission("gestionar_cronicas");return Response.json(await prisma.partido.findMany({where:{estado:"FINALIZADO"},select:{id:true,inicio:true,equipoLocal:{select:{nombre:true}},equipoVisitante:{select:{nombre:true}},cronica:{include:{publicaciones:true}}},orderBy:{inicio:"desc"}}))}catch(e){return apiError(e)}}
