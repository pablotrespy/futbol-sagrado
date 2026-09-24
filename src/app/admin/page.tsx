// Fase 1 / módulo 11: frontera protegida del panel administrativo.
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminPanel } from "@/components/admin/admin-panel";

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/acceso");
  if (!(["admin", "supervisor", "operador_de_mesa"] as string[]).includes(String(session.user.role))) redirect("/");
  return <AdminPanel user={{ name: session.user.name, role: String(session.user.role) }} />;
}
