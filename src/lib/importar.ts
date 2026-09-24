// Fase 5+: extracción y análisis de planillas Excel para importar equipos (fase 1)
// y reemplazar plantillas de jugadores (fase 6).
import * as XLSX from "xlsx";

export type FilaEquipoExtraida = { fila: number; nombre: string; color: string };
export type EstadoFila = "nuevo" | "existente" | "duplicado" | "error";
export type FilaAnalizada = FilaEquipoExtraida & { estado: EstadoFila; detalle: string };
export type AnalisisEquipos = { filas: FilaAnalizada[]; nuevos: number; existentes: number; errores: number };

const texto = (valor: unknown): string => String(valor ?? "").trim();
const clave = (valor: string): string => valor.toLocaleLowerCase();

export function extraerFilasEquipos(datos: Buffer): FilaEquipoExtraida[] {
  const libro = XLSX.read(datos, { type: "buffer" });
  const filas: FilaEquipoExtraida[] = [];
  for (const hoja of libro.SheetNames) {
    const matriz = XLSX.utils.sheet_to_json<unknown[]>(libro.Sheets[hoja], { header: 1, defval: "", blankrows: false });
    let encabezado = -1;
    let colNombre = -1;
    let colColor = -1;
    for (let indice = 0; indice < Math.min(matriz.length, 25); indice++) {
      const celdas = matriz[indice].map((celda) => clave(texto(celda)));
      const posicion = celdas.indexOf("nombre");
      if (posicion !== -1) {
        encabezado = indice;
        colNombre = posicion;
        colColor = celdas.findIndex((celda) => celda === "color" || celda === "colores");
        break;
      }
    }
    if (encabezado === -1 || colNombre === -1) continue;
    for (let indice = encabezado + 1; indice < matriz.length; indice++) {
      const nombre = texto(matriz[indice][colNombre]);
      if (!nombre) continue;
      filas.push({ fila: indice + 1, nombre, color: colColor === -1 ? "" : texto(matriz[indice][colColor]) });
    }
  }
  return filas;
}

export function analizarEquipos(filas: FilaEquipoExtraida[], nombresExistentes: string[]): AnalisisEquipos {
  const existentes = new Set(nombresExistentes.map((nombre) => clave(nombre)));
  const vistas = new Set<string>();
  const resultado = filas.map<FilaAnalizada>((fila) => {
    if (fila.nombre.length < 2 || fila.nombre.length > 80) return { ...fila, estado: "error", detalle: "El nombre debe tener entre 2 y 80 caracteres." };
    if (fila.color.length > 40) return { ...fila, estado: "error", detalle: "El color no puede superar 40 caracteres." };
    const llave = clave(fila.nombre);
    if (existentes.has(llave)) return { ...fila, estado: "existente", detalle: "Ya existe un equipo con este nombre." };
    if (vistas.has(llave)) return { ...fila, estado: "duplicado", detalle: "Repetido dentro del archivo." };
    vistas.add(llave);
    return { ...fila, estado: "nuevo", detalle: "" };
  });
  return {
    filas: resultado,
    nuevos: resultado.filter((fila) => fila.estado === "nuevo").length,
    existentes: resultado.filter((fila) => fila.estado === "existente").length,
    errores: resultado.filter((fila) => fila.estado === "error" || fila.estado === "duplicado").length,
  };
}

// ---------- Jugadores (fase 6): una hoja por club, reemplazo total del plantel ----------

export type FilaJugadorExtraida = { fila: number; nombres: string; apellidos: string; documento: string; fechaTexto: string; camisetaTexto: string; vinculo: string };
export type HojaJugadores = { hoja: string; filas: FilaJugadorExtraida[] };
export type EstadoJugador = "nuevo" | "actualizado" | "repetido" | "error";
export type FilaJugadorAnalizada = FilaJugadorExtraida & { estado: EstadoJugador; detalle: string; fechaNacimiento: string | null; numeroCamiseta: number | null };
export type PlantillaAnalizada = { hoja: string; equipo: string | null; detalle: string; activosActuales: number; filas: FilaJugadorAnalizada[] };
export type AnalisisJugadores = { plantillas: PlantillaAnalizada[]; equiposNoEncontrados: string[]; nuevos: number; actualizados: number; errores: number };

const ALIAS_FECHA = ["fecha nacimiento", "fecha de nacimiento", "fecha nac", "nacimiento", "f. nacimiento"];
const ALIAS_CAMISETA = ["no. camiseta", "nº camiseta", "no camiseta", "numero camiseta", "número camiseta", "nro camiseta", "camiseta", "dorsal"];
const ALIAS_VINCULO = ["vínculo", "vinculo", "relación con el colegio", "relacion con el colegio", "relación al colegio", "relacion al colegio", "parentesco", "vinc."];

function fechaExcel(valor: unknown): string {
  if (typeof valor === "number" && valor > 0) {
    const date = new Date((valor - 25569) * 86400000);
    if (!isNaN(date.getTime())) return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  }
  return texto(valor);
}

type ColumnasJugadores = { colNombres: number; colApellidos: number; colDocumento: number; colFecha: number; colCamiseta: number; colVinculo: number };

function localizarColumnas(celdas: string[]): ColumnasJugadores | null {
  const buscar = (coincidencias: string[]) => celdas.findIndex((celda) => coincidencias.includes(celda));
  const colNombres = buscar(["nombres", "nombre"]);
  const colApellidos = buscar(["apellidos", "apellido"]);
  if (colNombres === -1 || colApellidos === -1) return null;
  const colDocumento = buscar(["documento", "documento identidad", "cedula", "cédula", "doc"]);
  const colFecha = celdas.findIndex((celda) => ALIAS_FECHA.includes(celda));
  const colCamiseta = celdas.findIndex((celda) => ALIAS_CAMISETA.includes(celda));
  const colVinculo = celdas.findIndex((celda) => ALIAS_VINCULO.includes(celda));
  return { colNombres, colApellidos, colDocumento, colFecha, colCamiseta, colVinculo };
}

export function extraerFilasJugadores(datos: Buffer): HojaJugadores[] {
  const libro = XLSX.read(datos, { type: "buffer" });
  const hojas: HojaJugadores[] = [];
  for (const hoja of libro.SheetNames) {
    const matriz = XLSX.utils.sheet_to_json<unknown[]>(libro.Sheets[hoja], { header: 1, defval: "", blankrows: false });
    let columnas: (ColumnasJugadores & { encabezado: number }) | null = null;
    for (let indice = 0; indice < Math.min(matriz.length, 25) && !columnas; indice++) {
      const encontradas = localizarColumnas(matriz[indice].map((celda) => clave(texto(celda))));
      if (encontradas) columnas = { ...encontradas, encabezado: indice };
    }
    if (!columnas) continue;
    const filas: FilaJugadorExtraida[] = [];
    for (let indice = columnas.encabezado + 1; indice < matriz.length; indice++) {
      const linea = matriz[indice];
      const nombres = texto(linea[columnas.colNombres]);
      const apellidos = texto(linea[columnas.colApellidos]);
      if (!nombres && !apellidos) continue;
      filas.push({
        fila: indice + 1,
        nombres,
        apellidos,
        documento: columnas.colDocumento === -1 ? "" : texto(linea[columnas.colDocumento]),
        fechaTexto: columnas.colFecha === -1 ? "" : fechaExcel(linea[columnas.colFecha]),
        camisetaTexto: columnas.colCamiseta === -1 ? "" : texto(linea[columnas.colCamiseta]),
        vinculo: columnas.colVinculo === -1 ? "" : texto(linea[columnas.colVinculo]),
      });
    }
    hojas.push({ hoja, filas });
  }
  return hojas;
}

const DIAS_MES = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function normalizarFecha(valor: string): string | null {
  if (!valor) return null;
  const iso = valor.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  const latino = valor.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  const partes = iso ? [Number(iso[1]), Number(iso[2]), Number(iso[3])] : latino ? [Number(latino[3]), Number(latino[2]), Number(latino[1])] : null;
  if (!partes) return null;
  const [anio, mes, dia] = partes;
  if (mes < 1 || mes > 12 || dia < 1 || dia > DIAS_MES[mes - 1] || anio < 1900 || anio > 2100) return null;
  return `${String(anio).padStart(4, "0")}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export function normalizarCamiseta(valor: string): number | null {
  if (!valor) return null;
  const numero = Number(valor);
  return Number.isInteger(numero) ? numero : NaN;
}

export function analizarJugadores(
  hojas: HojaJugadores[],
  equipos: { id: string; nombre: string }[],
  jugadoresExistentes: { id: string; nombres: string; apellidos: string; documento: string | null; activo: boolean; equipoId: string }[],
): AnalisisJugadores {
  const equipoPorClave = new Map(equipos.map((equipo) => [clave(equipo.nombre), equipo]));
  const jugadorPorDocumento = new Map(jugadoresExistentes.filter((j) => j.documento).map((j) => [j.documento!, j]));
  const resultado: PlantillaAnalizada[] = [];
  const noEncontrados: string[] = [];
  let nuevos = 0;
  let actualizados = 0;
  let errores = 0;

  for (const hoja of hojas) {
    const equipo = equipoPorClave.get(clave(hoja.hoja.trim()));
    if (!equipo) {
      noEncontrados.push(hoja.hoja);
      resultado.push({ hoja: hoja.hoja, equipo: null, detalle: "No existe un equipo con este nombre.", activosActuales: 0, filas: [] });
      continue;
    }
    const delEquipo = jugadoresExistentes.filter((jugador) => jugador.equipoId === equipo.id);
    const nombrePorClave = new Map(delEquipo.map((jugador) => [clave(`${jugador.nombres} ${jugador.apellidos}`), jugador]));
    const documentosVistos = new Set<string>();
    const nombresVistos = new Set<string>();
    const filas = hoja.filas.map<FilaJugadorAnalizada>((fila) => {
      const base = { ...fila, fechaNacimiento: null as string | null, numeroCamiseta: null as number | null };
      const fallar = (detalle: string): FilaJugadorAnalizada => ({ ...base, estado: "error", detalle });
      if (base.nombres.length < 2 || base.nombres.length > 80) return fallar("Los nombres deben tener entre 2 y 80 caracteres.");
      if (base.apellidos.length < 2 || base.apellidos.length > 80) return fallar("Los apellidos deben tener entre 2 y 80 caracteres.");
      if (base.documento.length > 30) return fallar("El documento no puede superar 30 caracteres.");
      if (base.vinculo.length > 50) return fallar("El vínculo no puede superar 50 caracteres.");
      const camiseta = normalizarCamiseta(base.camisetaTexto);
      if (Number.isNaN(camiseta) || (camiseta !== null && (camiseta < 1 || camiseta > 999))) return fallar("La camiseta debe ser un número entero entre 1 y 999.");
      const fecha = normalizarFecha(base.fechaTexto);
      if (base.fechaTexto && !fecha) return fallar(`La fecha "${base.fechaTexto}" no es reconocida (usa AAAA-MM-DD o DD/MM/AAAA).`);
      base.fechaNacimiento = fecha;
      base.numeroCamiseta = camiseta;
      const llaveNombre = clave(`${base.nombres} ${base.apellidos}`);
      if ((base.documento && documentosVistos.has(base.documento)) || nombresVistos.has(llaveNombre)) return { ...base, estado: "repetido", detalle: "Repetido dentro de la hoja." };
      documentosVistos.add(base.documento);
      nombresVistos.add(llaveNombre);
      if (base.documento) {
        const porDocumento = jugadorPorDocumento.get(base.documento);
        if (porDocumento && porDocumento.equipoId !== equipo.id) return { ...base, estado: "error", detalle: "Ese documento ya pertenece a un jugador de otro equipo." };
        if (porDocumento) return { ...base, estado: "actualizado", detalle: "" };
      }
      if (nombrePorClave.has(llaveNombre)) return { ...base, estado: "actualizado", detalle: "" };
      return { ...base, estado: "nuevo", detalle: "" };
    });
    for (const fila of filas) {
      if (fila.estado === "nuevo") nuevos++;
      else if (fila.estado === "actualizado") actualizados++;
      else if (fila.estado === "error" || fila.estado === "repetido") errores++;
    }
    resultado.push({ hoja: hoja.hoja, equipo: equipo.nombre, detalle: "", activosActuales: delEquipo.filter((jugador) => jugador.activo).length, filas });
  }
  return { plantillas: resultado, equiposNoEncontrados: noEncontrados, nuevos, actualizados, errores };
}

// ---------- Personas (operadores de mesa / árbitros): una hoja con Nombres y Apellidos ----------

export type FilaPersonaExtraida = { fila: number; nombres: string; apellidos: string };
export type EstadoPersona = "nuevo" | "existente" | "duplicado" | "error";
export type FilaPersonaAnalizada = FilaPersonaExtraida & { estado: EstadoPersona; detalle: string };
export type AnalisisPersonas = { filas: FilaPersonaAnalizada[]; nuevos: number; existentes: number; errores: number };

type ColumnasPersonas = { colNombres: number; colApellidos: number };

function localizarColumnasPersonas(celdas: string[]): ColumnasPersonas | null {
  const colNombres = celdas.findIndex((celda) => celda === "nombres" || celda === "nombre");
  if (colNombres === -1) return null;
  const colApellidos = celdas.findIndex((celda) => celda === "apellidos" || celda === "apellido");
  if (colApellidos === -1) return null;
  return { colNombres, colApellidos };
}

export function extraerFilasPersonas(datos: Buffer): FilaPersonaExtraida[] {
  const libro = XLSX.read(datos, { type: "buffer" });
  const filas: FilaPersonaExtraida[] = [];
  for (const hoja of libro.SheetNames) {
    const matriz = XLSX.utils.sheet_to_json<unknown[]>(libro.Sheets[hoja], { header: 1, defval: "", blankrows: false });
    let columnas: (ColumnasPersonas & { encabezado: number }) | null = null;
    for (let indice = 0; indice < Math.min(matriz.length, 25) && !columnas; indice++) {
      const encontradas = localizarColumnasPersonas(matriz[indice].map((celda) => clave(texto(celda))));
      if (encontradas) columnas = { ...encontradas, encabezado: indice };
    }
    if (!columnas) continue;
    for (let indice = columnas.encabezado + 1; indice < matriz.length; indice++) {
      const linea = matriz[indice];
      const nombres = texto(linea[columnas.colNombres]);
      const apellidos = texto(linea[columnas.colApellidos]);
      if (!nombres && !apellidos) continue;
      filas.push({ fila: indice + 1, nombres, apellidos });
    }
  }
  return filas;
}

export function analizarPersonas(filas: FilaPersonaExtraida[], existentes: { nombres: string; apellidos: string }[] = []) {
  const existentesPorClave = new Set(existentes.map((persona) => clave(`${persona.nombres} ${persona.apellidos}`)));
  const vistas = new Set<string>();
  const resultado = filas.map<FilaPersonaAnalizada>((fila) => {
    if (fila.nombres.length < 2 || fila.nombres.length > 80) return { ...fila, estado: "error", detalle: "Los nombres deben tener entre 2 y 80 caracteres." };
    if (fila.apellidos.length < 2 || fila.apellidos.length > 80) return { ...fila, estado: "error", detalle: "Los apellidos deben tener entre 2 y 80 caracteres." };
    const llave = clave(`${fila.nombres} ${fila.apellidos}`);
    if (existentesPorClave.has(llave)) return { ...fila, estado: "existente", detalle: "Ya existe una persona con este nombre." };
    if (vistas.has(llave)) return { ...fila, estado: "duplicado", detalle: "Repetido dentro del archivo." };
    vistas.add(llave);
    return { ...fila, estado: "nuevo", detalle: "" };
  });
  return {
    filas: resultado,
    nuevos: resultado.filter((fila) => fila.estado === "nuevo").length,
    existentes: resultado.filter((fila) => fila.estado === "existente").length,
    errores: resultado.filter((fila) => fila.estado === "error" || fila.estado === "duplicado").length,
  };
}

