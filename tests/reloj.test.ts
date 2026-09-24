// Fase 5+: fronteras de tiempo de la cronología pública del partido y del cambio de estado manual.
import { describe, expect, it } from "vitest";
import { faseDePartido, formatoReloj, MINUTO_FINALIZACION, origenVirtual, puedeFinalizarActa } from "@/lib/reloj";

const inicio = new Date("2026-08-24T10:00:00");
const en = (segundos: number) => new Date(inicio.getTime() + segundos * 1000);
const programado = { inicio: inicio.toISOString(), estado: "PROGRAMADO" };
const enCurso = { inicio: inicio.toISOString(), estado: "EN_CURSO" };

describe("cronología automática (40' + descanso 10' + 40')", () => {
  it("muestra PREVIO antes de la hora programada", () => {
    expect(faseDePartido(programado, en(-1)).fase).toBe("PREVIO");
    expect(faseDePartido(programado, en(-3600)).segundos).toBeNull();
  });

  it("primer tiempo ascendente desde 00:00 hasta 39:59", () => {
    const arranque = faseDePartido(enCurso, en(0));
    expect(arranque.fase).toBe("PRIMER_TIEMPO");
    expect(formatoReloj(arranque.segundos!)).toBe("00:00");
    expect(formatoReloj(faseDePartido(enCurso, en(2399)).segundos!)).toBe("39:59");
  });

  it("entretiempo descendente desde 10:00 hasta 00:01", () => {
    const descanso = faseDePartido(enCurso, en(2400));
    expect(descanso.fase).toBe("ENTRETIEMPO");
    expect(formatoReloj(descanso.segundos!)).toBe("10:00");
    expect(formatoReloj(faseDePartido(enCurso, en(2999)).segundos!)).toBe("00:01");
  });

  it("segundo tiempo ascendente desde 40:00 hasta 79:59", () => {
    const vuelta = faseDePartido(enCurso, en(3000));
    expect(vuelta.fase).toBe("SEGUNDO_TIEMPO");
    expect(formatoReloj(vuelta.segundos!)).toBe("40:00");
    expect(formatoReloj(faseDePartido(enCurso, en(5399)).segundos!)).toBe("79:59");
  });

  it("finaliza por tiempo cumplido y por acta anticipada", () => {
    expect(faseDePartido(enCurso, en(5400)).fase).toBe("FINALIZADO");
    expect(faseDePartido({ ...programado, estado: "FINALIZADO" }, en(60)).fase).toBe("FINALIZADO");
    expect(faseDePartido({ ...programado, estado: "FINALIZADO" }, en(-60)).etiqueta).toBe("FIN");
  });
});

describe("cambio de estado con recalibración de origen", () => {
  it("fuerza el entretiempo al minuto indicado y desciende", () => {
    const ahora = new Date("2026-08-24T15:30:00");
    const origen = origenVirtual("ENTRETIEMPO", 5, ahora);
    const reloj = faseDePartido({ ...enCurso, inicioEfectivo: origen.toISOString() }, ahora);
    expect(reloj.fase).toBe("ENTRETIEMPO");
    expect(formatoReloj(reloj.segundos!)).toBe("05:00");
  });

  it("al agotarse el descanso forzado salta solo al segundo tiempo 40:00", () => {
    const ahora = new Date("2026-08-24T15:30:00");
    const origen = origenVirtual("ENTRETIEMPO", 10, ahora);
    const diezMinutosDespues = new Date(ahora.getTime() + 600000);
    const reloj = faseDePartido({ ...enCurso, inicioEfectivo: origen.toISOString() }, diezMinutosDespues);
    expect(reloj.fase).toBe("SEGUNDO_TIEMPO");
    expect(formatoReloj(reloj.segundos!)).toBe("40:00");
  });

  it("fuerza el primer tiempo en curso desde el minuto indicado", () => {
    const ahora = new Date("2026-08-24T16:00:00");
    const origen = origenVirtual("PRIMER_TIEMPO", 28, ahora);
    const reloj = faseDePartido({ ...enCurso, inicioEfectivo: origen.toISOString() }, ahora);
    expect(reloj.fase).toBe("PRIMER_TIEMPO");
    expect(formatoReloj(reloj.segundos!)).toBe("28:00");
  });

  it("sin recalibración usa la hora programada original", () => {
    const reloj = faseDePartido({ ...programado, inicioEfectivo: null }, en(1500));
    expect(reloj.fase).toBe("PRIMER_TIEMPO");
    expect(formatoReloj(reloj.segundos!)).toBe("25:00");
  });
});

describe("habilitación del botón Finalizar al minuto 80", () => {
  it("MINUTO_FINALIZACION es 80 y bloquea durante todo el desarrollo", () => {
    expect(MINUTO_FINALIZACION).toBe(80);
    expect(puedeFinalizarActa(faseDePartido(enCurso, en(-1)))).toBe(false);
    expect(puedeFinalizarActa(faseDePartido(enCurso, en(2399)))).toBe(false);
    expect(puedeFinalizarActa(faseDePartido(enCurso, en(2999)))).toBe(false);
    expect(puedeFinalizarActa(faseDePartido(enCurso, en(4799)))).toBe(false);
    expect(formatoReloj(faseDePartido(enCurso, en(4799)).segundos!)).toBe("69:59");
  });

  it("se habilita justo cuando el cronómetro público culmina: 79:59 aún no, FIN sí", () => {
    expect(formatoReloj(faseDePartido(enCurso, en(5399)).segundos!)).toBe("79:59");
    expect(puedeFinalizarActa(faseDePartido(enCurso, en(5399)))).toBe(false);
    const fin = faseDePartido(enCurso, en(5400));
    expect(fin.fase).toBe("FINALIZADO");
    expect(puedeFinalizarActa(fin)).toBe(true);
    expect(puedeFinalizarActa({ fase: "FINALIZADO", etiqueta: "FIN", segundos: null })).toBe(true);
  });

  it("respeta el origen recalibrado: forzar segundo tiempo 78:00 habilita a los dos minutos", () => {
    const ahora = new Date("2026-08-24T15:30:00");
    const origen = origenVirtual("SEGUNDO_TIEMPO", 78, ahora);
    const partido = { ...enCurso, inicioEfectivo: origen.toISOString() };
    expect(puedeFinalizarActa(faseDePartido(partido, ahora))).toBe(false);
    expect(puedeFinalizarActa(faseDePartido(partido, new Date(ahora.getTime() + 119000)))).toBe(false);
    expect(puedeFinalizarActa(faseDePartido(partido, new Date(ahora.getTime() + 120000)))).toBe(true);
  });
});
