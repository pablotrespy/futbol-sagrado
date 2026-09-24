// Almacenamiento de PDFs de comunicados en disco (mantiene la BD liviana).
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_PDF_BYTES = 10 * 1024 * 1024;

export function carpetaComunicados() {
  return path.join(process.cwd(), "data", "comunicados");
}

export function rutaDelArchivo(id: string) {
  return path.join(carpetaComunicados(), `${id}.pdf`);
}

export async function guardarPdf(id: string, buffer: Buffer) {
  const carpeta = carpetaComunicados();
  await mkdir(carpeta, { recursive: true });
  await writeFile(rutaDelArchivo(id), buffer);
}

export async function leerPdf(id: string): Promise<Buffer | null> {
  try {
    return await readFile(rutaDelArchivo(id));
  } catch {
    return null;
  }
}

export async function eliminarPdf(id: string) {
  try {
    await unlink(rutaDelArchivo(id));
  } catch {
    // El archivo puede no existir; no es un error bloqueante.
  }
}

export function carpetaPlanillas() {
  return path.join(process.cwd(), "data", "planillas");
}

export function rutaDePlanilla(id: string) {
  return path.join(carpetaPlanillas(), `${id}.xlsx`);
}

export async function guardarPlanilla(id: string, buffer: Buffer) {
  const carpeta = carpetaPlanillas();
  await mkdir(carpeta, { recursive: true });
  await writeFile(rutaDePlanilla(id), buffer);
}

export async function leerPlanilla(id: string): Promise<Buffer | null> {
  try {
    return await readFile(rutaDePlanilla(id));
  } catch {
    return null;
  }
}

export async function eliminarPlanilla(id: string) {
  try {
    await unlink(rutaDePlanilla(id));
  } catch {
    // El archivo puede no existir; no es un error bloqueante.
  }
}