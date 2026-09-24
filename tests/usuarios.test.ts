// Fase 6 / usuarios: generación de credenciales y contratos de alta.
import { describe, expect, it } from "vitest";
import { normalizarUsuario, primerNombreDe, generarClave } from "@/lib/usuarios";
import { crearUsuarioSchema, recoveryConfirmSchema } from "@/schemas/usuario";

describe("alta de usuarios: nombre de usuario", () => {
  it("extrae el primer nombre como identificador", () => {
    expect(primerNombreDe("María José Álvarez")).toBe("María");
    expect(primerNombreDe("  Juan   Pérez ")).toBe("Juan");
  });

  it("normaliza a minúsculas, sin acentos y sin símbolos", () => {
    expect(normalizarUsuario("María-Élise")).toBe("mariaelise");
    expect(normalizarUsuario("  ANTONIO ")).toBe("antonio");
    expect(normalizarUsuario("---")).toBe("usuario");
  });
});

describe("alta de usuarios: clave inicial", () => {
  it("genera primerNombre + 50 + los últimos tres dígitos del documento", () => {
    expect(generarClave("María José Álvarez", "123456789")).toBe("María50789");
  });

  it("usa los últimos tres dígitos aunque el documento tenga separadores", () => {
    expect(generarClave("Pablo Díaz", "987654321")).toBe("Pablo50321");
  });
});

describe("alta de usuarios: contratos zod", () => {
  it("acepta un alta válida", () => {
    const ok = crearUsuarioSchema.parse({ nombreCompleto: "Pablo Díaz", documento: "123456789", correo: "pablo@correo.com", telefono: "3001112233", rol: "delegado" });
    expect(ok.rol).toBe("delegado");
  });

  it("rechaza correo inválido, rol inválido y código no numérico de 6 dígitos", () => {
    expect(crearUsuarioSchema.safeParse({ nombreCompleto: "Pablo Díaz", documento: "123456789", correo: "no-es-correo", telefono: "3001112233", rol: "delegado" }).success).toBe(false);
    expect(crearUsuarioSchema.safeParse({ nombreCompleto: "Pablo Díaz", documento: "123456789", correo: "pablo@correo.com", telefono: "3001112233", rol: "root" }).success).toBe(false);
    expect(recoveryConfirmSchema.safeParse({ telefono: "3001112233", codigo: "12345", nuevaClave: "clave12345" }).success).toBe(false);
    expect(recoveryConfirmSchema.parse({ telefono: "3001112233", codigo: "123456", nuevaClave: "clave12345" }).codigo).toBe("123456");
  });

  it("acepta el correo omitido", () => {
    expect(crearUsuarioSchema.parse({ nombreCompleto: "Pablo Díaz", documento: "123456789", telefono: "3001112233", rol: "admin" }).correo).toBe("");
  });
});
