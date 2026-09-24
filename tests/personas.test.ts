// Catálogos de personas (operadores de mesa y árbitros): extracción y análisis
// de planillas Excel con columnas Nombres y Apellidos.
import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import { analizarPersonas, extraerFilasPersonas } from "@/lib/importar";

const construirLibro = (hojas: Record<string, unknown[][]>): Buffer => {
  const libro = XLSX.utils.book_new();
  for (const [nombre, filas] of Object.entries(hojas)) {
    XLSX.utils.book_append_sheet(libro, XLSX.utils.aoa_to_sheet(filas), nombre);
  }
  return XLSX.write(libro, { type: "buffer", bookType: "xlsx" }) as Buffer;
};

describe("extraerFilasPersonas", () => {
  it("lee nombres y apellidos ignorando espacios, filas vacías y hojas ajenas", () => {
    const datos = construirLibro({
      Operadores: [
        ["LISTA OPERADORES PLUS 50"],
        ["Nombres", "Apellidos", "Teléfono"],
        [" Juan José ", " Pérez Gómez ", "3001234567"],
        ["", "", ""],
        ["Carlos Andrés", "Rodríguez Meza"],
      ],
      "Requerimiento ": [["Descripcion"], ["Reglamento del Torneo"]],
      HojaVacia: [["Item"], [1]],
    });
    expect(extraerFilasPersonas(datos)).toEqual([
      { fila: 3, nombres: "Juan José", apellidos: "Pérez Gómez" },
      { fila: 5, nombres: "Carlos Andrés", apellidos: "Rodríguez Meza" },
    ]);
  });

  it("devuelve vacío si ninguna hoja trae encabezados de persona", () => {
    const datos = construirLibro({ Hoja1: [["Cancha", "Ubicación"], ["Principal", "Sector A"]] });
    expect(extraerFilasPersonas(datos)).toEqual([]);
  });
});

describe("analizarPersonas", () => {
  it("clasifica nuevos, existentes, duplicados y errores de longitud", () => {
    const analisis = analizarPersonas([
      { fila: 2, nombres: "Juan José", apellidos: "Pérez Gómez" },
      { fila: 3, nombres: "Nueva", apellidos: "Persona" },
      { fila: 4, nombres: "Nueva", apellidos: "Persona" },
      { fila: 5, nombres: "A", apellidos: "Corto" },
    ], [{ nombres: "Juan José", apellidos: "Pérez Gómez" }]);
    expect(analisis.filas.map((fila) => fila.estado)).toEqual(["existente", "nuevo", "duplicado", "error"]);
    expect(analisis.nuevos).toBe(1);
    expect(analisis.existentes).toBe(1);
    expect(analisis.errores).toBe(2);
    expect(analisis.filas[2].detalle).toContain("Repetido");
    expect(analisis.filas[3].detalle).toContain("Los nombres");
  });

  it("ignora mayúsculas para detectar coincidencias", () => {
    const analisis = analizarPersonas([{ fila: 2, nombres: "Jose Maria", apellidos: "alvarez" }], [{ nombres: "JOSE MARIA", apellidos: "ALVAREZ" }]);
    expect(analisis.filas[0].estado).toBe("existente");
  });
});