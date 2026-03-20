import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminReservationsPanel } from "@/components/admin/admin-reservations-panel";
import { AdminSignOutButton } from "@/components/admin/admin-sign-out-button";
import { requireAdmin } from "@/features/auth/require-admin";
import type { ReservationRecord } from "@/types/reservations";

export const metadata: Metadata = {
  title: "Admin reserveringen",
  description: "Beheer reserveringen voor Taxi De Polder.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      "max-image-preview": "none",
      "max-snippet": 0,
      "max-video-preview": 0,
    },
  },
};

export default async function AdminReservationsPage() {
  const { supabase, user } = await requireAdmin();

  const { data: reservations } = await supabase
    .from("reservations")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[#f6f4ee] px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-[#0b5a4e]/10 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,32,0.06)] md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#0b5a4e]">
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-black text-[#0f1720]">
              Reserveringen
            </h1>
            <p className="mt-2 text-[#475569]">Ingelogd als {user.email}</p>
          </div>

          <AdminSignOutButton />
        </div>

        <AdminNav />

        <AdminReservationsPanel
          initialReservations={(reservations ?? []) as ReservationRecord[]}
        />
      </div>
    </main>
  );
}