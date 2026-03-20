import { createAdminClient } from "@/lib/supabase/admin";
import {
  calculateDynamicPrice,
  findMatchingSpecialRate,
  type PricingSetting,
  type SpecialRate,
  type VehicleType,
} from "@/lib/pricing";

export async function getPricingData() {
  const supabase = createAdminClient();

  const [{ data: settings, error: settingsError }, { data: rates, error: ratesError }] =
    await Promise.all([
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

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  if (ratesError) {
    throw new Error(ratesError.message);
  }

  return {
    settings: (settings ?? []) as PricingSetting[],
    rates: (rates ?? []) as SpecialRate[],
  };
}

export async function getComputedPrice(params: {
  pickup: string;
  destination: string;
  vehicle: VehicleType;
  pickupHour?: number;
  distanceKm: number;
}) {
  const { settings, rates } = await getPricingData();

  const setting = settings.find((item) => item.vehicle_type === params.vehicle);

  if (!setting) {
    throw new Error(`Geen pricing_settings gevonden voor ${params.vehicle}`);
  }

  const matchedRate = findMatchingSpecialRate({
    pickup: params.pickup,
    destination: params.destination,
    vehicle: params.vehicle,
    rates,
  });

  if (matchedRate) {
    return {
      mode: "special" as const,
      total: Number(matchedRate.fixed_price),
      matchedRate,
    };
  }

  return calculateDynamicPrice({
    settings: setting,
    distanceKm: params.distanceKm,
    pickupHour: params.pickupHour,
    pickup: params.pickup,
    destination: params.destination,
  });
}