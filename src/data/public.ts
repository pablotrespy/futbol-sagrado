// Fase 5 / módulo 10: capa pública server-only con DTOs mínimos y sin datos sensibles.
import "server-only";
import { prisma } from "@/lib/prisma";
import { ordenarPorTemporada } from "@/lib/torneos";

async function getTorneosPublicos() {
  const torneos = await prisma.torneo.findMany({
    where: { estado: { in: ["ACTIVO", "FINALIZADO"] } },
    select: { id: true, nombre: true, temporada: true },
    orderBy: { createdAt: "desc" },
  });
  const finalizados = await prisma.partido.findMany({
    where: { estado: "FINALIZADO", jornada: { torneoId: { in: torneos.map((t) => t.id) } } },
    select: { jornada: { select: { torneoId: true } } },
  });
  const actividad: Record<string, number> = {};
  for (const p of finalizados) actividad[p.jornada.torneoId] = (actividad[p.jornada.torneoId] ?? 0) + 1;
  return ordenarPorTemporada(torneos).sort((a, b) => (actividad[b.id] ?? 0) - (actividad[a.id] ?? 0));
}

export async function getPublicChampionship(torneoId?: string) {
  const tournaments=await getTorneosPublicos();const selected=tournaments.find(t=>t.id===torneoId)??tournaments[0];if(!selected)return{tournaments,selected:null,jornadas:[],tabla:[],goleadores:[],sanciones:[],cronicas:[]};
  const [jornadas,tabla,goleadores,sanctions,cronicas]=await Promise.all([prisma.jornada.findMany({where:{torneoId:selected.id},select:{id:true,numero:true,nombre:true,fecha:true,estado:true,partidos:{select:{id:true,inicio:true,inicioEfectivo:true,estado:true,equipoLocal:{select:{id:true,nombre:true}},equipoVisitante:{select:{id:true,nombre:true}},cancha:{select:{nombre:true}},acta:{select:{goles:{select:{equipoId:true,minuto:true,autogol:true,jugador:{select:{id:true,nombres:true,apellidos:true}}}},tarjetas:{select:{id:true,tipo:true,minuto:true,jugador:{select:{id:true,nombres:true,apellidos:true}}},orderBy:{minuto:"asc"}}}}},orderBy:{inicio:"asc"}}},orderBy:{numero:"asc"}}),prisma.clasificacionEquipo.findMany({where:{torneoId:selected.id},select:{id:true,jugados:true,ganados:true,empatados:true,perdidos:true,golesFavor:true,golesContra:true,puntos:true,puntosFairPlay:true,equipo:{select:{id:true,nombre:true}}},orderBy:[{puntos:"desc"},{golesFavor:"desc"},{puntosFairPlay:"asc"}]}),prisma.estadisticaJugador.findMany({where:{torneoId:selected.id,goles:{gt:0}},select:{id:true,goles:true,jugador:{select:{id:true,nombres:true,apellidos:true,equipo:{select:{nombre:true}}}}},orderBy:{goles:"desc"},take:15}),prisma.sancion.findMany({where:{torneoId:selected.id,estado:"ACTIVA"},select:{id:true,motivo:true,indefinida:true,duracionFechas:true,jornadaInicioNumero:true,jugador:{select:{id:true,nombres:true,apellidos:true,equipo:{select:{nombre:true}}}}}}),prisma.cronica.findMany({where:{estado:"PUBLICADA",partido:{jornada:{torneoId:selected.id}}},select:{id:true,titulo:true,texto:true,publicadaAt:true,partido:{select:{id:true,equipoLocal:{select:{nombre:true}},equipoVisitante:{select:{nombre:true}}}}},orderBy:{publicadaAt:"desc"},take:3})]);const currentRound=jornadas.reduce((max,j)=>j.partidos.some(p=>p.estado==="FINALIZADO")?Math.max(max,j.numero):max,0)+1;return{tournaments,selected,jornadas,tabla,goleadores,sanciones:sanctions.filter(s=>s.indefinida||currentRound<s.jornadaInicioNumero+(s.duracionFechas??0)),cronicas};
}

export async function getPublicPlayer(id:string){return prisma.jugador.findUnique({where:{id},select:{id:true,nombres:true,apellidos:true,numeroCamiseta:true,posicion:true,activo:true,equipo:{select:{id:true,nombre:true}},estadisticas:{select:{goles:true,amarillas:true,rojas:true,torneo:{select:{nombre:true,temporada:true}}}},sanciones:{select:{id:true,motivo:true,duracionFechas:true,indefinida:true,estado:true,torneo:{select:{nombre:true}}},orderBy:{createdAt:"desc"}},goles:{select:{id:true,minuto:true,acta:{select:{partido:{select:{id:true,inicio:true,equipoLocal:{select:{nombre:true}},equipoVisitante:{select:{nombre:true}}}}}}},orderBy:{createdAt:"desc"},take:20}}})}

export async function getPublicSanciones(torneoId?: string) {
  const tournaments = await getTorneosPublicos();
  const selected = tournaments.find((t) => t.id === torneoId) ?? tournaments[0];
  if (!selected) return { tournaments, selected: null, sanciones: [] as never[] };
  const sanciones = await prisma.sancion.findMany({
    where: { torneoId: selected.id, estado: "ACTIVA" },
    select: {
      id: true, motivo: true, tarjeta: true, jornadaInicioNumero: true,
      duracionFechas: true, indefinida: true,
      jugador: { select: { id: true, nombres: true, apellidos: true, equipo: { select: { id: true, nombre: true } } } },
    },
    orderBy: { jornadaInicioNumero: "asc" },
  });
  return { tournaments, selected, sanciones };
}

export async function getPublicTorneos(torneoId?: string) {
  const tournaments = await getTorneosPublicos();
  const selected = tournaments.find((t) => t.id === torneoId) ?? tournaments[0];
  return { tournaments, selected: selected ?? null };
}

export async function getPublicPosiciones(torneoId?: string) {
  const tournaments = await getTorneosPublicos();
  const selected = tournaments.find((t) => t.id === torneoId) ?? tournaments[0];
  if (!selected) return { tournaments, selected: null, tabla: [] as never[], goleadores: [] as never[], forma: {} as Record<string, Array<"G" | "E" | "P">>, historial: {} as Record<string, never[]> };
  const [tabla, goleadores, partidos] = await Promise.all([
    prisma.clasificacionEquipo.findMany({
      where: { torneoId: selected.id },
      select: { id: true, jugados: true, ganados: true, empatados: true, perdidos: true, golesFavor: true, golesContra: true, puntos: true, puntosFairPlay: true, equipo: { select: { id: true, nombre: true } } },
      orderBy: [{ puntos: "desc" }, { golesFavor: "desc" }, { puntosFairPlay: "asc" }],
    }),
    prisma.estadisticaJugador.findMany({
      where: { torneoId: selected.id, goles: { gt: 0 } },
      select: { id: true, goles: true, jugador: { select: { id: true, nombres: true, apellidos: true, equipo: { select: { id: true, nombre: true } } } } },
      orderBy: { goles: "desc" },
      take: 15,
    }),
    prisma.partido.findMany({
      where: { jornada: { torneoId: selected.id }, estado: "FINALIZADO" },
      select: { id: true, inicio: true, equipoLocalId: true, equipoVisitanteId: true, jornada: { select: { numero: true } }, equipoLocal: { select: { nombre: true } }, equipoVisitante: { select: { nombre: true } }, acta: { select: { goles: { select: { equipoId: true } } } } },
    }),
  ]);
  const ordenados = [...partidos].sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
  const forma: Record<string, Array<"G" | "E" | "P">> = {};
  const historial: Record<string, Array<{ jornada: number; inicio: string; local: string; visitante: string; equipoLocalId: string; equipoVisitanteId: string; golesLocal: number; golesVisitante: number }>> = {};
  for (const match of ordenados) {
    if (!match.acta) continue;
    const localGoals = match.acta.goles.filter((g) => g.equipoId === match.equipoLocalId).length;
    const visitorGoals = match.acta.goles.filter((g) => g.equipoId === match.equipoVisitanteId).length;
    const localResult: "G" | "E" | "P" = localGoals > visitorGoals ? "G" : localGoals < visitorGoals ? "P" : "E";
    const visitorResult: "G" | "E" | "P" = visitorGoals > localGoals ? "G" : localGoals > visitorGoals ? "P" : "E";
    (forma[match.equipoLocalId] ??= []).push(localResult);
    (forma[match.equipoVisitanteId] ??= []).push(visitorResult);
    const entrada = { jornada: match.jornada.numero, inicio: match.inicio.toISOString(), local: match.equipoLocal.nombre, visitante: match.equipoVisitante.nombre, equipoLocalId: match.equipoLocalId, equipoVisitanteId: match.equipoVisitanteId, golesLocal: localGoals, golesVisitante: visitorGoals };
    (historial[match.equipoLocalId] ??= []).push(entrada);
    (historial[match.equipoVisitanteId] ??= []).push(entrada);
  }
  return { tournaments, selected, tabla, goleadores, forma, historial };
}
export async function getPublicTeam(id:string){return prisma.equipo.findUnique({where:{id},select:{id:true,nombre:true,color:true,activo:true,jugadores:{where:{activo:true},select:{id:true,nombres:true,apellidos:true,numeroCamiseta:true,posicion:true},orderBy:[{numeroCamiseta:"asc"},{apellidos:"asc"}]},clasificaciones:{select:{jugados:true,ganados:true,empatados:true,perdidos:true,golesFavor:true,golesContra:true,puntos:true,torneo:{select:{nombre:true,temporada:true}}}},partidosLocal:{where:{estado:"FINALIZADO"},select:{id:true,inicio:true,equipoLocal:{select:{nombre:true}},equipoVisitante:{select:{nombre:true}},acta:{select:{goles:{select:{equipoId:true}}}}},orderBy:{inicio:"desc"},take:10}}})}

export async function getPublicComunicados(torneoId?: string) {
  const tournaments = await getTorneosPublicos();
  const selected = tournaments.find((t) => t.id === torneoId) ?? tournaments[0];
  if (!selected) return { tournaments, selected: null, comunicados: [] as never[] };
  const comunicados = await prisma.comunicado.findMany({
    where: { torneoId: selected.id },
    select: { id: true, resolucion: true, fecha: true, nombreArchivo: true },
    orderBy: { fecha: "desc" },
  });
  return { tournaments, selected, comunicados };
}
