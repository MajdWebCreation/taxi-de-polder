import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getAuthenticatedAdminUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRow) {
    return null;
  }

  return { supabase, user };
}

export async function requireAdmin() {
  const admin = await getAuthenticatedAdminUser();

  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
}
