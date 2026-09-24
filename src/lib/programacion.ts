// Fase 2 / módulos 3 y 4: algoritmo round robin y reglas puras de colisiones.

export type PartidoPropuesto = { equipoLocalId: string; equipoVisitanteId: string; canchaId: string; inicio: Date; duracionMinutos: number; operadorId?: string | null; arbitroId?: string | null };

export function roundRobinPairings(teamIds: string[], roundNumber: number) {
  const teams: Array<string | null> = [...teamIds];
  if (teams.length % 2) teams.push(null);
  const rounds = teams.length - 1;
  if (teamIds.length < 2 || roundNumber < 1 || roundNumber > rounds) throw new Error(`La jornada debe estar entre 1 y ${Math.max(rounds, 1)}`);
  const rotated = [...teams];
  for (let round = 1; round < roundNumber; round++) rotated.splice(1, 0, rotated.pop()!);
  const pairs: Array<{ equipoLocalId: string; equipoVisitanteId: string }> = [];
  for (let index = 0; index < rotated.length / 2; index++) {
    const first = rotated[index]; const second = rotated[rotated.length - 1 - index];
    if (first && second) pairs.push(roundNumber % 2 === 0 ? { equipoLocalId: second, equipoVisitanteId: first } : { equipoLocalId: first, equipoVisitanteId: second });
  }
  return { pairs, totalRounds: rounds };
}

const end = (match: PartidoPropuesto) => match.inicio.getTime() + match.duracionMinutos * 60_000;
const overlap = (a: PartidoPropuesto, b: PartidoPropuesto) => a.inicio.getTime() < end(b) && b.inicio.getTime() < end(a);
const sharesTeam = (a: PartidoPropuesto, b: PartidoPropuesto) => [a.equipoLocalId, a.equipoVisitanteId].some((id) => id === b.equipoLocalId || id === b.equipoVisitanteId);

export function validateSchedule(candidates: PartidoPropuesto[], existing: PartidoPropuesto[] = []) {
  const errors: string[] = [];
  candidates.forEach((match, index) => {
    if (match.equipoLocalId === match.equipoVisitanteId) errors.push(`Partido ${index + 1}: el equipo está repetido.`);
    [...candidates.slice(0, index), ...existing].forEach((other) => {
      if (overlap(match, other) && match.canchaId === other.canchaId) errors.push(`Partido ${index + 1}: la cancha ya está ocupada en ese horario.`);
      if (overlap(match, other) && sharesTeam(match, other)) errors.push(`Partido ${index + 1}: uno de los equipos ya juega en ese horario.`);
    });
  });
  return [...new Set(errors)];
}

export type DiaProgramado = { fecha: string; horaInicio: string };
export type AsignacionDia = { operadorId?: string; arbitroId?: string };
export type CanchaProgramada = { canchaId: string; dias: AsignacionDia[] };

export function buildAutomaticSchedule(input: { teamIds: string[]; roundNumber: number; days: DiaProgramado[]; canchas: CanchaProgramada[]; duration: number; interval: number }) {
  const { pairs, totalRounds } = roundRobinPairings(input.teamIds, input.roundNumber);
  const capacity = input.canchas.length * input.days.length;
  const matches = pairs.map((pair, index) => {
    const dayIndex = Math.floor(index / input.canchas.length);
    if (dayIndex >= input.days.length) throw new Error(`Los días indicados no alcanzan para ${pairs.length} partidos con ${input.canchas.length} canchas por día (capacidad de ${capacity}).`);
    const cancha = input.canchas[index % input.canchas.length];
    const asignacion = cancha.dias[dayIndex];
    if (!asignacion?.operadorId || !asignacion?.arbitroId) throw new Error(`Falta asignación de operador o árbitro para ${cancha.canchaId} en el día ${dayIndex + 1}.`);
    const day = input.days[dayIndex];
    const base = new Date(`${day.fecha}T${day.horaInicio}:00-05:00`);
    return { ...pair, canchaId: cancha.canchaId, inicio: base, duracionMinutos: input.duration, operadorId: asignacion.operadorId, arbitroId: asignacion.arbitroId };
  });
  return { totalRounds, matches };
}
