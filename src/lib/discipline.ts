// Fase 6: regla disciplinaria pura compartida por servidor, portal y pruebas.
export type SanctionWindow = {
  indefinida: boolean;
  jornadaInicioNumero: number;
  duracionFechas: number | null;
};

export function isSanctionActiveAt(sanction: SanctionWindow, round: number) {
  if (round < sanction.jornadaInicioNumero) return false;
  if (sanction.indefinida) return true;
  if (sanction.duracionFechas === null) return true;
  return round < sanction.jornadaInicioNumero + sanction.duracionFechas;
}
