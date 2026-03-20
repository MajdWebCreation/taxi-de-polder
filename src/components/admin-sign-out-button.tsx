"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export function AdminSignOutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-full border border-[#0b5a4e]/15 px-4 py-2 text-sm font-semibold text-[#0b5a4e] transition hover:bg-[#0b5a4e]/5"
    >
      Uitloggen
    </button>
  );
}