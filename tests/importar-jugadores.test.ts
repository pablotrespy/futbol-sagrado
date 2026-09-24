// Fase 6: pruebas de importación/exportación de plantillas de jugadores y cálculo de edad.
import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import { analizarJugadores, extraerFilasJugadores, normalizarCamiseta, normalizarFecha } from "@/lib/importar";
import { calcularEdad } from "@/lib/edad";

const construirLibro = (hojas: Record<string, unknown[][]>): Buffer => {
  const libro = XLSX.utils.book_new();
  for (const [nombre, filas] of Object.entries(hojas)) {
    XLSX.utils.book_append_sheet(libro, XLSX.utils.aoa_to_sheet(filas), nombre);
  }
  return XLSX.write(libro, { type: "buffer", bookType: "xlsx" }) as Buffer;
};

describe("calcularEdad", () => {
  it("calcula años cumplidos y devuelve null sin fecha o inválida", () => {
    const hoy = new Date("2026-08-24T12:00:00");
    expect(calcularEdad("1976-03-15", hoy)).toBe(50);
    expect(calcularEdad("1976-09-15", hoy)).toBe(49);
    expect(calcularEdad(new Date("1980-08-24T05:00:00"), hoy)).toBe(46);
    expect(calcularEdad(null, hoy)).toBeNull();
    expect(calcularEdad("", hoy)).toBeNull();
  });
});

describe("normalizarFecha y normalizarCamiseta", () => {
  it("acepta AAAA-MM-DD y DD/MM/AAAA; rechaza lo imposible", () => {
    expect(normalizarFecha("1976-03-15")).toBe("1976-03-15");
    expect(normalizarFecha("15/03/1976")).toBe("1976-03-15");
    expect(normalizarFecha("15-3-1976")).toBe("1976-03-15");
    expect(normalizarFecha("31/02/1980")).toBeNull();
    expect(normalizarFecha("ayer")).toBeNull();
    expect(normalizarCamiseta("10")).toBe(10);
    expect(normalizarCamiseta("diez")).toBeNaN();
    expect(normalizarCamiseta("")).toBeNull();
  });
});

describe("extraerFilasJugadores", () => {
  it("lee una hoja por club con título sobre el encabezado e ignora Edad y hojas ajenas", () => {
    const datos = construirLibro({
      Killeros: [
        ["PLANTILLA KILLEROS PLUS 50"],
        ["Nombres", "Apellidos", "Documento", "Fecha nacimiento", "Nº camiseta", "Edad"],
        [" Juan José ", " Pérez Gómez ", "1098765432", "15/03/1976", "10", "50"],
        ["", "", "", "", "", ""],
        ["Carlos Andrés", "Rodríguez Meza", "", "1980-08-22", "1", ""],
      ],
      "Requerimiento ": [["Descripcion"], ["Reglamento del Torneo"]],
      HojaVacia: [["Item"], [1]],
    });
    const hojas = extraerFilasJugadores(datos);
    expect(hojas).toHaveLength(1);
    expect(hojas[0].hoja).toBe("Killeros");
    expect(hojas[0].filas).toEqual([
      { fila: 3, nombres: "Juan José", apellidos: "Pérez Gómez", documento: "1098765432", fechaTexto: "15/03/1976", camisetaTexto: "10", vinculo: "" },
      { fila: 5, nombres: "Carlos Andrés", apellidos: "Rodríguez Meza", documento: "", fechaTexto: "1980-08-22", camisetaTexto: "1", vinculo: "" },
    ]);
  });

  it("devuelve vacío si ninguna hoja trae encabezados de jugadores", () => {
    const datos = construirLibro({ Hoja1: [["Equipo", "Color"], ["Killeros", "rojo"]] });
    expect(extraerFilasJugadores(datos)).toEqual([]);
  });
});

const EQUIPOS = [
  { id: "eq-killeros", nombre: "Killeros" },
  { id: "eq-unidos", nombre: "Unidos" },
];
const EXISTENTES = [
  { id: "j1", nombres: "Juan José", apellidos: "Pérez Gómez", documento: "1098765432", activo: true, equipoId: "eq-killeros" },
  { id: "j2", nombres: "Luis", apellidos: "Márquez", documento: null, activo: true, equipoId: "eq-unidos" },
];

describe("analizarJugadores", () => {
  it("clasifica nuevos, actualizados por documento y nombre, duplicados y errores", () => {
    const analisis = analizarJugadores(
      [
        {
          hoja: "Killeros",
          filas: [
            { fila: 2, nombres: "Juan José", apellidos: "Pérez Gómez", documento: "1098765432", fechaTexto: "", camisetaTexto: "9", vinculo: "" },
            { fila: 3, nombres: "Nuevo", apellidos: "Jugador", documento: "", fechaTexto: "2000-01-05", camisetaTexto: "3", vinculo: "" },
            { fila: 4, nombres: "Nuevo", apellidos: "Jugador", documento: "", fechaTexto: "", camisetaTexto: "", vinculo: "" },
            { fila: 5, nombres: "A", apellidos: "Corto", documento: "", fechaTexto: "", camisetaTexto: "", vinculo: "" },
            { fila: 6, nombres: "Camiseta", apellidos: "Inválida", documento: "", fechaTexto: "", camisetaTexto: "1000", vinculo: "" },
          ],
        },
        { hoja: "Fantasma", filas: [{ fila: 2, nombres: "Alguien", apellidos: "Distinto", documento: "", fechaTexto: "", camisetaTexto: "", vinculo: "" }] },
      ],
      EQUIPOS,
      EXISTENTES,
    );
    const killeros = analisis.plantillas[0];
    expect(killeros.equipo).toBe("Killeros");
    expect(killeros.activosActuales).toBe(1);
    expect(killeros.filas.map((fila) => fila.estado)).toEqual(["actualizado", "nuevo", "repetido", "error", "error"]);
    expect(analisis.nuevos).toBe(1);
    expect(analisis.actualizados).toBe(1);
    expect(analisis.errores).toBe(3);
    expect(analisis.equiposNoEncontrados).toEqual(["Fantasma"]);
    expect(analisis.plantillas[1].equipo).toBeNull();
  });

  it("rechaza documento ya usado por otro equipo", () => {
    const analisis = analizarJugadores(
      [{ hoja: "Unidos", filas: [{ fila: 2, nombres: "Pedro", apellidos: "García", documento: "1098765432", fechaTexto: "", camisetaTexto: "", vinculo: "" }] }],
      EQUIPOS,
      EXISTENTES,
    );
    expect(analisis.plantillas[0].filas[0].estado).toBe("error");
    expect(analisis.plantillas[0].filas[0].detalle).toContain("otro equipo");
  });

  it("normaliza fecha y camiseta en filas válidas para el confirmado", () => {
    const analisis = analizarJugadores(
      [{ hoja: "Killeros", filas: [{ fila: 2, nombres: "Alguien", apellidos: "Nuevo", documento: "", fechaTexto: "5/1/1990", camisetaTexto: "007", vinculo: "" }] }],
      EQUIPOS,
      EXISTENTES,
    );
    const fila = analisis.plantillas[0].filas[0];
    expect(fila.estado).toBe("nuevo");
    expect(fila.fechaNacimiento).toBe("1990-01-05");
    expect(fila.numeroCamiseta).toBe(7);
  });
});
