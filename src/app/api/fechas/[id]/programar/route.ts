// Fase 2 / módulo 3: programación automática o manual con validación transaccional.
import { Prisma } from "@/generated/prisma/client";
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { buildAutomaticSchedule, roundRobinPairings, validateSchedule, type PartidoPropuesto } from "@/lib/programacion";
import { requirePermission } from "@/lib/rbac";
import { programarFechaSchema } from "@/schemas/programacion";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("programar"); const { id } = await context.params; const input = programarFechaSchema.parse(await request.json());
    const result = await prisma.$transaction(async (tx) => {
      const jornada = await tx.jornada.findUnique({ where: { id }, include: { partidos: true } }); if (!jornada) throw new Error("NOT_FOUND"); if (jornada.estado !== "NORMAL") throw new Error("CONFLICT:La jornada no está activa; solo se programan jornadas normales."); if (input.modo === "auto" && jornada.partidos.length) throw new Error("CONFLICT:La jornada ya tiene partidos; elimínalos antes de generar el round robin.");
      let matches: PartidoPropuesto[];
      if (input.modo === "auto") {
        const [teams, courts] = await Promise.all([tx.equipo.findMany({ where: { activo: true, torneoId: jornada.torneoId }, select: { id: true }, orderBy: { nombre: "asc" } }), tx.cancha.findMany({ where: { id: { in: input.canchas.map((item) => item.canchaId) }, activa: true }, select: { id: true, nombre: true } })]);
        if (teams.length < 2) throw new Error("CONFLICT:Se necesitan al menos dos equipos activos."); if (courts.length !== new Set(input.canchas.map((item) => item.canchaId)).size) throw new Error("CONFLICT:Alguna cancha no existe o está inactiva.");
        const pares = roundRobinPairings(teams.map((team) => team.id), jornada.numero).pairs.length;
        if (pares > input.dias.length * input.canchas.length) throw new Error(`CONFLICT:Los días indicados no alcanzan para ${pares} partidos con ${input.canchas.length} canchas por día; agrega ${Math.ceil(pares / input.canchas.length)} días en total.`);
        const nombreCancha = new Map(courts.map((item) => [item.id, item.nombre]));
        for (let index = 0; index < pares; index++) {
          const canchaItem = input.canchas[index % input.canchas.length];
          const dayIndex = Math.floor(index / input.canchas.length);
          const celda = canchaItem.dias[dayIndex];
          if (!celda?.operadorId || !celda?.arbitroId) throw new Error(`CONFLICT:Falta el Juez u Operador en «${nombreCancha.get(canchaItem.canchaId) ?? "cancha"}» para el día ${dayIndex + 1}.`);
        }
        matches = buildAutomaticSchedule({ teamIds: teams.map((team) => team.id), roundNumber: jornada.numero, days: input.dias, canchas: input.canchas, duration: input.duracionMinutos, interval: input.intervaloMinutos }).matches;
      } else matches = input.partidos.map((match) => ({ ...match, inicio: new Date(match.inicio), operadorId: match.operadorId || null, arbitroId: match.arbitroId || null }));
      const flatTeamIds = matches.flatMap((match) => [match.equipoLocalId, match.equipoVisitanteId]); const ids = new Set(flatTeamIds); const courtIds = new Set(matches.map((match) => match.canchaId)); const operadorIds = new Set(matches.flatMap((match) => match.operadorId ? [match.operadorId] : [])); const arbitroIds = new Set(matches.flatMap((match) => match.arbitroId ? [match.arbitroId] : []));
      if (ids.size !== flatTeamIds.length) throw new Error("CONFLICT:Un equipo no puede aparecer dos veces en la misma jornada.");
      const alreadyScheduled = new Set(jornada.partidos.flatMap((match) => [match.equipoLocalId, match.equipoVisitanteId])); if (flatTeamIds.some((teamId) => alreadyScheduled.has(teamId))) throw new Error("CONFLICT:Uno de los equipos ya tiene partido en esta jornada.");
      const [teamCount, courtCount, existing, operadorCount, arbitroCount] = await Promise.all([tx.equipo.count({ where: { id: { in: [...ids] }, activo: true, torneoId: jornada.torneoId } }), tx.cancha.count({ where: { id: { in: [...courtIds] }, activa: true } }), tx.partido.findMany({ where: { estado: { not: "CANCELADO" } }, select: { equipoLocalId: true, equipoVisitanteId: true, canchaId: true, inicio: true, duracionMinutos: true } }), operadorIds.size ? tx.operador.count({ where: { id: { in: [...operadorIds] }, activo: true } }) : Promise.resolve(0), arbitroIds.size ? tx.arbitro.count({ where: { id: { in: [...arbitroIds] }, activo: true } }) : Promise.resolve(0)]);
      if (teamCount !== ids.size || courtCount !== courtIds.size) throw new Error("CONFLICT:Hay equipos (de este torneo) o canchas inexistentes/inactivos."); if (operadorCount !== operadorIds.size || arbitroCount !== arbitroIds.size) throw new Error("CONFLICT:El operador de mesa o el árbitro asignado no existe o está inactivo."); const conflicts = validateSchedule(matches, existing); if (conflicts.length) throw new Error(`CONFLICT:${conflicts.join(" ")}`);
      await tx.partido.createMany({ data: matches.map((match) => ({ ...match, jornadaId: id })) }); return { creados: matches.length };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return Response.json(result, { status: 201 });
  } catch (error) { return apiError(error); }
}
