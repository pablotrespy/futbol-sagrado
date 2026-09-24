// Orden de torneos por temporada: año actual primero, futuros ascendente, pasados al final.
export function ordenarPorTemporada<T extends { temporada: string }>(items: T[], ref: Date = new Date()): T[] {
  const anioActual = ref.getFullYear();
  const anioDe = (temporada: string) => {
    const n = Number.parseInt(temporada, 10);
    return Number.isNaN(n) ? NaN : n;
  };
  return [...items].sort((a, b) => {
    const ay = anioDe(a.temporada);
    const by = anioDe(b.temporada);
    const rank = (y: number) => (Number.isNaN(y) ? 2 : y === anioActual ? 0 : y < anioActual ? 2 : 1);
    if (ay === by) return 0;
    // Pasados (rank 2) al final: primero los de mayor año (más recientes)
    if (rank(ay) === 2 && rank(by) === 2) return by - ay;
    if (rank(ay) !== rank(by)) return rank(ay) - rank(by);
    // Futuros (rank 1) ascendente; actuales (rank 0) entre sí no importa
    return ay - by;
  });
}
