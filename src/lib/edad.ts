// Fase 6: cálculo de edad a partir de la fecha de nacimiento.
export function calcularEdad(fechaNacimiento: Date | string | null | undefined, hoy: Date = new Date()): number | null {
  if (!fechaNacimiento) return null;
  const nacimiento = fechaNacimiento instanceof Date ? fechaNacimiento : new Date(String(fechaNacimiento).includes("T") ? String(fechaNacimiento) : `${fechaNacimiento}T00:00:00`);
  if (Number.isNaN(nacimiento.getTime()) || nacimiento > hoy) return null;
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad;
}
