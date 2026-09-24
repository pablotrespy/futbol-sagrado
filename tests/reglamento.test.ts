// Reglamento "Tarjetas en un mismo partido": multa y suspensión según combinación.
import { describe, expect, it } from "vitest";
import { calcularSancion, codigoDeTarjetas, calcularMulta, CODIGOS_TARJETA } from "@/lib/reglamento";

const casos: Array<{ codigo: string; multa: number; duracionFechas: number | null; indefinida: boolean; etiqueta: string }> = [
  { codigo: "AMARILLA", multa: 15000, duracionFechas: 0, indefinida: false, etiqueta: "Sin suspensión" },
  { codigo: "AMARILLA+AMARILLA", multa: 30000, duracionFechas: 1, indefinida: false, etiqueta: "1 fecha" },
  { codigo: "AZUL", multa: 25000, duracionFechas: 2, indefinida: false, etiqueta: "2 fechas" },
  { codigo: "ROJA", multa: 40000, duracionFechas: 3, indefinida: false, etiqueta: "3 fechas" },
  { codigo: "AMARILLA+AZUL", multa: 40000, duracionFechas: 2, indefinida: false, etiqueta: "2 fechas" },
  { codigo: "AMARILLA+ROJA", multa: 55000, duracionFechas: 3, indefinida: false, etiqueta: "3 fechas" },
  { codigo: "AZUL+ROJA", multa: 65000, duracionFechas: 5, indefinida: false, etiqueta: "5 fechas" },
  { codigo: "AMARILLA+AZUL+ROJA", multa: 80000, duracionFechas: null, indefinida: true, etiqueta: "Suspendido del torneo" },
];

describe("reglamento de tarjetas", () => {
  it.each(casos)("$codigo: multa $multa y $etiqueta", ({ codigo, multa, duracionFechas, indefinida, etiqueta }) => {
    expect(calcularSancion(codigo)).toEqual({ multa, duracionFechas, indefinida, etiqueta });
    expect(calcularMulta(codigo)).toBe(multa);
  });

  it("genera el código canónico en orden Amarilla→Azul→Roja", () => {
    expect(codigoDeTarjetas(["ROJA", "AMARILLA", "AZUL"])).toBe("AMARILLA+AZUL+ROJA");
    expect(codigoDeTarjetas(["AMARILLA", "AMARILLA"])).toBe("AMARILLA+AMARILLA");
  });

  it("enumera las 8 combinaciones de la reglamentación", () => {
    expect(CODIGOS_TARJETA).toEqual(["AMARILLA", "AMARILLA+AMARILLA", "AZUL", "ROJA", "AMARILLA+AZUL", "AMARILLA+ROJA", "AZUL+ROJA", "AMARILLA+AZUL+ROJA"]);
  });
});