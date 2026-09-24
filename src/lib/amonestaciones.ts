// Lógica de amonestaciones: tarjetas de partidos finalizados agrupadas por jugador + partido.
// Compartida por el endpoint administrativo (/api/amonestaciones) y el público (/api/public/amonestaciones).
import { prisma } from "@/lib/prisma";
import { calcularSancion, codigoDeTarjetas, type TipoTarjeta } from "@/lib/reglamento";
import { isSanctionActiveAt } from "@/lib/discipline";

type TarjetaRow = Awaited<ReturnType<typeof prisma.tarjeta.findMany>>[number] & {
  acta: {
    partido: {
      id: string; inicio: Date;
      equipoLocal: { id: string; nombre: string };
      equipoVisitante: { id: string; nombre: string };
      jornada: { id: string; numero: number; nombre: string; torneoId: string };
    };
  };
  jugador: {
    id: string; nombres: string; apellidos: string;
    equipo: { id: string; nombre: string };
  };
};

export type AmonestacionItem = {
  id: string;
  tarjetas: TipoTarjeta[];
  tipo: string;
  multa: number;
  sancion: { etiqueta: string; duracionFechas: number | null; indefinida: boolean };
  jugador: { id: string; nombres: string; apellidos: string; equipo: { id: string; nombre: string } };
  partidoId: string;
  partido: string;
  inicio: string;
  jornada: number;
  jornadaNombre: string;
  torneoId: string;
  minuto: number;
  valor: number | null;
  estado: "INHABILITADO" | "HABILITADO";
  pagada: boolean;
  activa: boolean;
  cumplida: boolean;
  revocada: boolean;
  sancionId: string | null;
  pendientes: number | null;
};

export async function getAmonestacionesItems(opts: { torneoId?: string; showMontos: boolean }): Promise<AmonestacionItem[]> {
  const { torneoId, showMontos } = opts;
  const where: Record<string, unknown> = { acta: { finalizadaAt: { not: null } } };
  if (torneoId) {
    where.acta = { ...where.acta as Record<string, unknown>, partido: { jornada: { torneoId } } };
  }
  const tarjetas = (await prisma.tarjeta.findMany({
    where,
    select: {
      id: true,
      tipo: true,
      minuto: true,
      jugador: { select: { id: true, nombres: true, apellidos: true, equipo: { select: { id: true, nombre: true } } } },
      acta: { select: { partido: { select: { id: true, inicio: true, equipoLocal: { select: { id: true, nombre: true } }, equipoVisitante: { select: { id: true, nombre: true } }, jornada: { select: { id: true, numero: true, nombre: true, torneoId: true } } } } } },
    },
  })) as TarjetaRow[];

  const jugadorIds = [...new Set(tarjetas.map((t) => t.jugador.id))];
  const torneoIds = [...new Set(tarjetas.map((t) => t.acta.partido.jornada.torneoId))];
  const partidoIds = [...new Set(tarjetas.map((t) => t.acta.partido.id))];

  const [sanciones, rondas] = await Promise.all([
    prisma.sancion.findMany({
      where: { jugadorId: { in: jugadorIds }, torneoId: { in: torneoIds }, partidoId: { in: partidoIds } },
      select: { id: true, jugadorId: true, partidoId: true, estado: true, estadoPago: true, indefinida: true, jornadaInicioNumero: true, duracionFechas: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.jornada.findMany({
      where: { torneoId: { in: torneoIds }, partidos: { some: { estado: "FINALIZADO" } } },
      select: { torneoId: true, numero: true },
    }),
  ]);

  const maxRonda: Record<string, number> = {};
  for (const r of rondas) maxRonda[r.torneoId] = Math.max(maxRonda[r.torneoId] ?? 0, r.numero);
  const siguienteRonda = (torneoIdKey: string) => (maxRonda[torneoIdKey] ?? 0) + 1;

  const sancionPorGrupo = new Map<string, (typeof sanciones)[number]>();
  for (const s of sanciones) {
    const key = `${s.jugadorId}:${s.partidoId}`;
    if (!sancionPorGrupo.has(key)) sancionPorGrupo.set(key, s);
  }

  type Grupo = { id: string; jugador: TarjetaRow["jugador"]; partidoId: string; inicio: Date; jornada: number; jornadaNombre: string; torneoId: string; equipoLocalNombre: string; equipoVisitanteNombre: string; tipos: string[]; minutos: number[] };
  const grupos = new Map<string, Grupo>();
  for (const t of tarjetas) {
    const partido = t.acta.partido;
    const key = `${t.jugador.id}:${partido.id}`;
    const existente = grupos.get(key);
    if (existente) { existente.tipos.push(t.tipo); existente.minutos.push(t.minuto); existente.id = t.id; continue; }
    grupos.set(key, {
      id: t.id,
      jugador: t.jugador,
      partidoId: partido.id,
      inicio: partido.inicio,
      jornada: partido.jornada.numero,
      jornadaNombre: partido.jornada.nombre,
      torneoId: partido.jornada.torneoId,
      equipoLocalNombre: partido.equipoLocal.nombre,
      equipoVisitanteNombre: partido.equipoVisitante.nombre,
      tipos: [t.tipo],
      minutos: [t.minuto],
    });
  }

  const items = [...grupos.values()].map((g) => {
    const codigo = codigoDeTarjetas(g.tipos as TipoTarjeta[]);
    const reg = calcularSancion(codigo);
    const sancion = sancionPorGrupo.get(`${g.jugador.id}:${g.partidoId}`);
    const pagada = sancion?.estadoPago === "PAGADA";
    const revocada = sancion?.estado === "REVOCADA";
    const activa = !!sancion && sancion.estado === "ACTIVA" && isSanctionActiveAt(sancion, siguienteRonda(g.torneoId));
    const cumplida = !!pagada && !!sancion && sancion.estado === "ACTIVA" && !activa;
    const pendientes = activa && !sancion?.indefinida && sancion?.duracionFechas != null
      ? sancion.jornadaInicioNumero + sancion.duracionFechas - siguienteRonda(g.torneoId)
      : null;
    return {
      id: g.id,
      tarjetas: g.tipos as TipoTarjeta[],
      tipo: codigo,
      multa: reg.multa,
      sancion: { etiqueta: reg.etiqueta, duracionFechas: reg.duracionFechas, indefinida: reg.indefinida },
      jugador: g.jugador,
      partidoId: g.partidoId,
      partido: `${g.equipoLocalNombre} vs ${g.equipoVisitanteNombre}`,
      inicio: g.inicio.toISOString(),
      jornada: g.jornada,
      jornadaNombre: g.jornadaNombre,
      torneoId: g.torneoId,
      minuto: g.minutos[g.minutos.length - 1],
      valor: showMontos ? reg.multa : null,
      estado: pagada ? "HABILITADO" : "INHABILITADO",
      pagada,
      activa,
      cumplida,
      revocada,
      sancionId: sancion?.id ?? null,
      pendientes,
    } satisfies AmonestacionItem;
  });
  items.sort((a, b) => a.jornada - b.jornada || String(a.inicio).localeCompare(String(b.inicio)) || a.jugador.apellidos.localeCompare(b.jugador.apellidos));

  return items;
}