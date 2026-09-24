// Fase 6 / usuarios: generación de credenciales para el alta de accesos.
import { randomInt } from "node:crypto";

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

const MINUSCULAS = "abcdefghijklmnopqrstuvwxyz";
const MAYUSCULAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITOS = "0123456789";
const SIMBOLOS = "!@#$%^&*()-_=+";

// Clave inicial aleatoria: evita patrones adivinables (nombre + documento).
export function generarClave() {
  const rnd = (n: number) => randomInt(n);
  const seguro = (set: string) => set[rnd(set.length)];
  const todas = MINUSCULAS + MAYUSCULAS + DIGITOS + SIMBOLOS;
  const partes = [
    seguro(MAYUSCULAS),
    seguro(MINUSCULAS),
    seguro(DIGITOS),
    seguro(SIMBOLOS),
    ...Array.from({ length: 10 }, () => seguro(todas)),
  ];
  for (let i = partes.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [partes[i], partes[j]] = [partes[j], partes[i]];
  }
  return partes.join("");
}