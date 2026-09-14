import { redirect } from "next/navigation";
import { getAdminSession, type AdminSession } from "@/features/auth/session";

/**
 * Vervangt de vorige Supabase-controle (auth.getUser + admin_users lookup).
 * Levert null op zodra er geen geldige server-side sessie is; API-routes
 * vertalen dat naar 401, pagina's naar een redirect.
 */
export async function getAuthenticatedAdminUser(): Promise<AdminSession | null> {
  return getAdminSession();
}

export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getAuthenticatedAdminUser();

  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
}
