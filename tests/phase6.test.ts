// Fase 6: cobertura de los seis flujos funcionales y la matriz de permisos.
import { describe, expect, it } from "vitest";
import { canchaSchema } from "@/schemas/cancha";
import { equipoSchema } from "@/schemas/equipo";
import { jugadorSchema } from "@/schemas/jugador";
import { actaSchema } from "@/schemas/acta";
import { editarCronicaSchema, publicarCronicaSchema } from "@/schemas/cronica";
import { sancionSchema } from "@/schemas/sancion";
import { comunicadoSchema } from "@/schemas/comunicado";
import { hasPermission, canAssignRole } from "@/lib/access-policy";
import { isSanctionActiveAt } from "@/lib/discipline";
import { buildAutomaticSchedule, validateSchedule } from "@/lib/programacion";

describe("flujo 1: configuración de canchas", () => {
  it("normaliza entradas válidas y rechaza nombres incompletos", () => {
    expect(canchaSchema.parse({ nombre: "  Cancha Norte  ", ubicacion: "", descripcion: "", activa: true }).nombre).toBe("Cancha Norte");
    expect(canchaSchema.safeParse({ nombre: "A", activa: true }).success).toBe(false);
  });
});

describe("flujo 2: equipos y jugadores", () => {
  it("valida el catálogo completo en cliente y servidor con los mismos contratos", () => {
    expect(equipoSchema.safeParse({ nombre: "Rojos", color: "Rojo", activo: true, torneoId: "torneo-1" }).success).toBe(true);
    expect(jugadorSchema.safeParse({ nombres: "Juan", apellidos: "Pérez", equipoId: "equipo-1", activo: true, numeroCamiseta: 10 }).success).toBe(true);
    expect(jugadorSchema.safeParse({ nombres: "J", apellidos: "P", equipoId: "", activo: true }).success).toBe(false);
  });
});

describe("flujo 3: programación", () => {
  it("genera una ronda sin repetir equipos y detecta colisiones", () => {
    const generated = buildAutomaticSchedule({ teamIds: ["a", "b", "c", "d"], roundNumber: 1, days: [{ fecha: "2026-08-20", horaInicio: "08:00" }, { fecha: "2026-08-21", horaInicio: "08:00" }], canchas: [{ canchaId: "norte", dias: [{ operadorId: "op1", arbitroId: "ar1" }, { operadorId: "op2", arbitroId: "ar2" }] }], duration: 60, interval: 10 });
    expect(generated.matches).toHaveLength(2);
    expect(new Set(generated.matches.flatMap((match) => [match.equipoLocalId, match.equipoVisitanteId])).size).toBe(4);
    expect(generated.matches[0].operadorId).toBe("op1");
    expect(generated.matches[0].arbitroId).toBe("ar1");
    expect(generated.matches[1].operadorId).toBe("op2");
    expect(generated.matches[1].arbitroId).toBe("ar2");
    const clash = { equipoLocalId: "x", equipoVisitanteId: "y", canchaId: "norte", inicio: generated.matches[0].inicio, duracionMinutos: 60 };
    expect(validateSchedule([clash], generated.matches)).toContain("Partido 1: la cancha ya está ocupada en ese horario.");
  });

  it("exige la asignación de operador y árbitro en cada celda usada", () => {
    expect(() => buildAutomaticSchedule({ teamIds: ["a", "b", "c", "d"], roundNumber: 1, days: [{ fecha: "2026-08-20", horaInicio: "08:00" }], canchas: [{ canchaId: "c1", dias: [{ operadorId: "", arbitroId: "ar1" }] }], duration: 60, interval: 10 })).toThrow("Falta asignación de operador o árbitro para c1 en el día 1.");
  });

  it("reparte un partido por cancha por día y pasa los sobrantes al siguiente día", () => {
    const dias = [{ fecha: "2026-08-20", horaInicio: "08:00" }, { fecha: "2026-08-21", horaInicio: "09:00" }];
    const canchas = ["c1", "c2", "c3", "c4", "c5"].map((canchaId) => ({ canchaId, dias: [{ operadorId: `d1-${canchaId}`, arbitroId: `d1-${canchaId}-ar` }, { operadorId: `d2-${canchaId}`, arbitroId: `d2-${canchaId}-ar` }] }));
    const generated = buildAutomaticSchedule({ teamIds: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"], roundNumber: 1, days: dias, canchas, duration: 90, interval: 10 });
    expect(generated.matches).toHaveLength(5);
    expect(generated.matches.slice(0, 5).every((match) => match.inicio.toISOString().startsWith("2026-08-20T13:00"))).toBe(true);
    expect(generated.matches.map((match) => match.operadorId)).toEqual(["d1-c1", "d1-c2", "d1-c3", "d1-c4", "d1-c5"]);
    const fullGenerate = buildAutomaticSchedule({ teamIds: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"], roundNumber: 1, days: dias, canchas, duration: 90, interval: 10 });
    expect(fullGenerate.matches).toHaveLength(6);
    expect(fullGenerate.matches[5].inicio.toISOString().startsWith("2026-08-21T14:00")).toBe(true);
    expect(fullGenerate.matches[5].operadorId).toBe("d2-c1");
    expect(() => buildAutomaticSchedule({ teamIds: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"], roundNumber: 1, days: [{ fecha: "2026-08-20", horaInicio: "08:00" }], canchas, duration: 90, interval: 10 })).toThrow("Los días indicados no alcanzan");
  });
});

describe("flujo 4: acta, sanciones y resultados", () => {
  it("bloquea durante la ventana exacta y valida el acta estructurada", () => {
    const sanction = { indefinida: false, jornadaInicioNumero: 3, duracionFechas: 2 };
    expect(isSanctionActiveAt(sanction, 2)).toBe(false);
    expect(isSanctionActiveAt(sanction, 3)).toBe(true);
    expect(isSanctionActiveAt(sanction, 4)).toBe(true);
    expect(isSanctionActiveAt(sanction, 5)).toBe(false);
    expect(sancionSchema.safeParse({ jugadorId: "j1", torneoId: "t1", motivo: "Roja directa", jornadaInicioNumero: 3, duracionFechas: 2, indefinida: false }).success).toBe(true);
    expect(actaSchema.safeParse({ alineacion: [{ jugadorId: "j1", titular: true }], goles: [{ jugadorId: "j1", equipoId: "e1", minuto: 181 }], tarjetas: [], finalizar: true }).success).toBe(false);
  });
});

describe("flujo 5: crónica y publicación", () => {
  it("exige revisión extensa y al menos un canal admitido", () => {
    expect(editarCronicaSchema.safeParse({ titulo: "Título", texto: "corto", aprobar: true }).success).toBe(false);
    expect(publicarCronicaSchema.safeParse({ canales: [] }).success).toBe(false);
    expect(publicarCronicaSchema.safeParse({ canales: ["X", "INSTAGRAM"] }).success).toBe(true);
  });

  it("valida el comunicado con resolución no vacía y fecha válida", () => {
    expect(comunicadoSchema.safeParse({ resolucion: "012-2026", fecha: "2026-09-05" }).success).toBe(true);
    expect(comunicadoSchema.safeParse({ resolucion: "   ", fecha: "2026-09-05" }).success).toBe(false);
    expect(comunicadoSchema.safeParse({ resolucion: "015-2026", fecha: "no-es-fecha" }).success).toBe(false);
  });
});

describe("flujo 6: consulta pública y RBAC", () => {
  it("mantiene administración, operación y consulta estrictamente separadas", () => {
    expect(hasPermission("admin", "crear_torneo")).toBe(true);
    expect(hasPermission("supervisor", "crear_torneo")).toBe(false);
    expect(hasPermission("supervisor", "programar")).toBe(true);
    expect(hasPermission("operador_de_mesa", "operar_mesa")).toBe(true);
    expect(hasPermission("operador_de_mesa", "crear_torneo")).toBe(false);
    expect(hasPermission("operador_de_mesa", "ver_planilla_montos")).toBe(false);
    expect(hasPermission("delegado", "ver_planilla_montos")).toBe(true);
    expect(hasPermission("delegado", "operar_mesa")).toBe(false);
    expect(hasPermission("desconocido", "consultar")).toBe(false);
    expect(hasPermission("admin", "gestionar_comunicados")).toBe(true);
    expect(hasPermission("supervisor", "gestionar_comunicados")).toBe(true);
    expect(hasPermission("operador_de_mesa", "gestionar_comunicados")).toBe(false);
    expect(hasPermission("delegado", "gestionar_comunicados")).toBe(false);
  });

  it("restringe la asignación de roles según el alcance de cada gestor", () => {
    expect(canAssignRole("admin", "admin", "u-admin", "u-otro")).toBe(true);
    expect(canAssignRole("admin", "admin", "u-admin", "u-admin")).toBe(false);
    expect(canAssignRole("admin", "supervisor", "u-admin", "u-sup")).toBe(true);
    expect(canAssignRole("supervisor", "operador_de_mesa", "u-sup", "u-op")).toBe(true);
    expect(canAssignRole("supervisor", "delegado", "u-sup", "u-del")).toBe(true);
    expect(canAssignRole("supervisor", "admin", "u-sup", "u-admin")).toBe(false);
    expect(canAssignRole("operador_de_mesa", "delegado", "u-op", "u-del")).toBe(false);
  });
});
