// Fase 6 / usuarios: generación de credenciales para el alta de accesos.
export function primerNombreDe(nombreCompleto: string) {
  return nombreCompleto.trim().split(/\s+/)[0] ?? "";
}

export function normalizarUsuario(nombre: string) {
  const limpio = nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
  return limpio || "usuario";
}

export function generarClave(nombreCompleto: string, documento: string) {
  const primerNombre = primerNombreDe(nombreCompleto).trim();
  const cedula = documento.trim();
  return `${primerNombre}50${cedula.slice(-3)}`;
}
