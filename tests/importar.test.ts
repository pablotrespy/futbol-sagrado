// Fase 5+: pruebas unitarias de extracción y análisis de planillas de equipos.
import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import { analizarEquipos, extraerFilasEquipos } from "@/lib/importar";

const construirLibro = (hojas: Record<string, unknown[][]>): Buffer => {
  const libro = XLSX.utils.book_new();
  for (const [nombre, filas] of Object.entries(hojas)) {
    XLSX.utils.book_append_sheet(libro, XLSX.utils.aoa_to_sheet(filas), nombre);
  }
  return XLSX.write(libro, { type: "buffer", bookType: "xlsx" }) as Buffer;
};

describe("extraerFilasEquipos", () => {
  it("localiza el encabezado en cualquier posición y recorta espacios", () => {
    const datos = construirLibro({
      "Lista de Equipos ": [
        ["", "LISTA DE EQUIPOS PLUS 50", ""],
        ["", "", "Nombre", "color"],
        ["", "1", " Killeros ", " rojo "],
        ["", "2", "", ""],
        ["", "3", "Super Gol ", "amarillo"],
      ],
      "Requerimiento ": [["Descripcion"], ["Reglamento del Torneo"]],
    });
    expect(extraerFilasEquipos(datos)).toEqual([
      { fila: 3, nombre: "Killeros", color: "rojo" },
      { fila: 5, nombre: "Super Gol", color: "amarillo" },
    ]);
  });

  it("devuelve vacío si ninguna hoja tiene encabezado Nombre", () => {
    const datos = construirLibro({ Hoja1: [["Item", "Equipo"], [1, "Killeros"]] });
    expect(extraerFilasEquipos(datos)).toEqual([]);
  });

  it("lee hoja con encabezado en la primera fila", () => {
    const datos = construirLibro({ Hoja1: [["Nombre", "Color"], ["Unidos", "vinotinto"]] });
    expect(extraerFilasEquipos(datos)).toEqual([{ fila: 2, nombre: "Unidos", color: "vinotinto" }]);
  });
});

describe("analizarEquipos", () => {
  const filas = [
    { fila: 4, nombre: "Killeros", color: "rojo" },
    { fila: 5, nombre: "Estrellas", color: "celeste" },
    { fila: 6, nombre: "killeros", color: "" },
    { fila: 7, nombre: "A", color: "" },
    { fila: 8, nombre: "Tiburones", color: "x".repeat(41) },
  ];

  it("clasifica nuevos, existentes, duplicados y errores con conteos", () => {
    const analisis = analizarEquipos(filas, ["estrellas"]);
    expect(analisis.filas.map((f) => f.estado)).toEqual(["nuevo", "existente", "duplicado", "error", "error"]);
    expect(analisis.nuevos).toBe(1);
    expect(analisis.existentes).toBe(1);
    expect(analisis.errores).toBe(3);
  });

  it("sin existentes ni errores todo queda nuevo", () => {
    const analisis = analizarEquipos(filas.slice(0, 1), []);
    expect(analisis.nuevos).toBe(1);
    expect(analisis.existentes + analisis.errores).toBe(0);
  });
});
