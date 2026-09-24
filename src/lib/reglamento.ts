// Reglamento "Tarjetas en un mismo partido": multa (suma de valores) y suspensión por combinación.
export type TipoTarjeta = "AMARILLA" | "AZUL" | "ROJA";
export const VALOR_TARJETA: Record<TipoTarjeta, number> = { AMARILLA: 15000, AZUL: 25000, ROJA: 40000 };
const ORDEN: TipoTarjeta[] = ["AMARILLA", "AZUL", "ROJA"];

export type SancionReglamento = {
  multa: number;
  duracionFechas: number | null; // null => suspendido del torneo; 0 => sin suspensión
  indefinida: boolean;
  etiqueta: string;
};

export function calcularTarjetas(codigo: string): TipoTarjeta[] {
  return codigo.split("+").filter((t): t is TipoTarjeta => t === "AMARILLA" || t === "AZUL" || t === "ROJA");
}

export function calcularSancion(tarjetas: TipoTarjeta[] | string): SancionReglamento {
  const lista = typeof tarjetas === "string" ? calcularTarjetas(tarjetas) : tarjetas;
  const am = lista.filter((t) => t === "AMARILLA").length;
  const az = lista.filter((t) => t === "AZUL").length;
  const ro = lista.filter((t) => t === "ROJA").length;
  const multa = am * VALOR_TARJETA.AMARILLA + az * VALOR_TARJETA.AZUL + ro * VALOR_TARJETA.ROJA;
  if (am >= 1 && az >= 1 && ro >= 1) return { multa, duracionFechas: null, indefinida: true, etiqueta: "Suspendido del torneo" };
  const fechas = (az >= 1 ? 2 : 0) + (ro >= 1 ? 3 : 0) + (am >= 2 ? 1 : 0);
  return {
    multa,
    duracionFechas: fechas,
    indefinida: false,
    etiqueta: fechas === 0 ? "Sin suspensión" : fechas === 1 ? "1 fecha" : `${fechas} fechas`,
  };
}

export const CODIGOS_TARJETA = ["AMARILLA", "AMARILLA+AMARILLA", "AZUL", "ROJA", "AMARILLA+AZUL", "AMARILLA+ROJA", "AZUL+ROJA", "AMARILLA+AZUL+ROJA"] as const;
export type CodigoTarjeta = (typeof CODIGOS_TARJETA)[number];

export function codigoDeTarjetas(tarjetas: TipoTarjeta[]): string {
  const conteo: Record<TipoTarjeta, number> = { AMARILLA: 0, AZUL: 0, ROJA: 0 };
  for (const t of tarjetas) conteo[t] += 1;
  return ORDEN.flatMap((tipo) => Array.from({ length: conteo[tipo] }, () => tipo)).join("+");
}

export function calcularMulta(codigo: string): number {
  return calcularSancion(codigo).multa;
}