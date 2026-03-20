import { requireAdmin } from "@/lib/admin-auth";
import { AdminPricingPanel } from "@/components/admin-pricing-panel";
import { AdminSignOutButton } from "@/components/admin-sign-out-button";

export default async function AdminPricingPage() {
  const { supabase, user } = await requireAdmin();

  const [{ data: settings }, { data: rates }] = await Promise.all([
    supabase
      .from("pricing_settings")
      .select("*")
      .order("vehicle_type", { ascending: true }),
    supabase
      .from("special_rates")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true }),
  ]);

  return (
    <main className="min-h-screen bg-[#f6f4ee] px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-[#0b5a4e]/10 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,32,0.06)] md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#0b5a4e]">
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-black text-[#0f1720]">
              Tarieven beheren
            </h1>
            <p className="mt-2 text-[#475569]">
              Ingelogd als {user.email}
            </p>
          </div>

          <AdminSignOutButton />
        </div>

        <AdminPricingPanel
          initialSettings={(settings ?? []) as never[]}
          initialRates={(rates ?? []) as never[]}
        />
      </div>
    </main>
  );
}