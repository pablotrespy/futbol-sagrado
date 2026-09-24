// Fase 0 / módulo 11: política RBAC compartida para proteger operaciones del torneo.
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { hasPermission, type AppRole, type Permission } from "@/lib/access-policy";

export { hasPermission, roles, canAssignRole } from "@/lib/access-policy";
export type { AppRole, Permission } from "@/lib/access-policy";

export async function requirePermission(permission: Permission) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("UNAUTHENTICATED");

  const role = session.user.role as AppRole;
  if (!hasPermission(role, permission)) {
    throw new Error("FORBIDDEN");
  }

  return session;
}

export async function requireRole(allowed: readonly AppRole[]) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("UNAUTHENTICATED");

  const role = session.user.role as AppRole;
  if (!allowed.includes(role)) throw new Error("FORBIDDEN");
  return session;
}

export async function requireAnyPermission(...permissions: Permission[]) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("UNAUTHENTICATED");

  const role = session.user.role as AppRole;
  if (!permissions.some((permission) => hasPermission(role, permission))) {
    throw new Error("FORBIDDEN");
  }

  return session;
}
