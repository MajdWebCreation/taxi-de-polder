import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminPricingPanel } from "@/components/admin/admin-pricing-panel";
import { AdminSignOutButton } from "@/components/admin/admin-sign-out-button";
import { requireAdmin } from "@/features/auth/require-admin";
import {
  normalizePricingSetting,
  normalizeSpecialRate,
} from "@/features/pricing/engine";
import {
  selectPricingSettings,
  selectSpecialRates,
} from "@/features/pricing/repository";
import type { PricingSettingRecord, SpecialRate } from "@/types/pricing";

export const metadata: Metadata = {
  title: "Admin tarieven",
  description: "Beheer tarieven voor Taxi De Polder.",
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

export default async function AdminPricingPage() {
  const admin = await requireAdmin();

  const [settings, rates] = await Promise.all([
    selectPricingSettings(),
    selectSpecialRates(),
  ]);

  const normalizedSettings: PricingSettingRecord[] = settings.map(
    (item, index) => ({
      id: Number(item.id),
      ...normalizePricingSetting(item, `pricing_settings[${index}]`),
    })
  );

  const normalizedRates: SpecialRate[] = rates.map((item, index) =>
    normalizeSpecialRate(item, `special_rates[${index}]`)
  );

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
            <p className="mt-2 text-[#475569]">Ingelogd als {admin.email}</p>
          </div>

          <AdminSignOutButton />
        </div>

        <AdminNav />

        <AdminPricingPanel
          initialSettings={normalizedSettings}
          initialRates={normalizedRates}
        />
      </div>
    </main>
  );
}
