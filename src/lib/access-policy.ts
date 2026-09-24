// Fase 6: matriz pura de permisos usada por RBAC y por sus pruebas automatizadas.
export const roles = ["admin", "supervisor", "operador_de_mesa", "delegado"] as const;
export type AppRole = (typeof roles)[number];

export type Permission =
  | "crear_torneo"
  | "gestionar_roles"
  | "gestionar_catalogos"
  | "programar"
  | "operar_mesa"
  | "gestionar_cronicas"
  | "publicar_redes"
  | "gestionar_amonestaciones"
  | "gestionar_comunicados"
  | "ver_planilla_montos"
  | "consultar";

const permissions: Record<AppRole, readonly Permission[]> = {
  admin: [
    "crear_torneo",
    "gestionar_roles",
    "gestionar_catalogos",
    "programar",
    "operar_mesa",
    "gestionar_cronicas",
    "publicar_redes",
    "gestionar_amonestaciones",
    "gestionar_comunicados",
    "ver_planilla_montos",
    "consultar",
  ],
  supervisor: [
    "gestionar_roles",
    "gestionar_catalogos",
    "programar",
    "operar_mesa",
    "gestionar_cronicas",
    "publicar_redes",
    "gestionar_amonestaciones",
    "gestionar_comunicados",
    "ver_planilla_montos",
    "consultar",
  ],
  operador_de_mesa: ["operar_mesa", "consultar"],
  delegado: ["ver_planilla_montos", "consultar"],
};

export function hasPermission(role: string, permission: Permission) {
  return roles.includes(role as AppRole) && permissions[role as AppRole].includes(permission);
}

// Roles que puede asignar cada rol gestor (alcance de "gestionar_roles").
export const assignableRoles: Record<AppRole, readonly AppRole[]> = {
  admin: ["admin", "supervisor", "operador_de_mesa", "delegado"],
  supervisor: ["operador_de_mesa", "delegado"],
  operador_de_mesa: [],
  delegado: [],
};

export function canAssignRole(actorRole: string, targetRole: string, selfId: string, targetId: string) {
  if (!roles.includes(actorRole as AppRole) || !roles.includes(targetRole as AppRole)) return false;
  const allowed = assignableRoles[actorRole as AppRole];
  if (!allowed.includes(targetRole as AppRole)) return false;
  if (targetRole === "admin" && selfId === targetId) return false;
  return true;
}
