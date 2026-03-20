import { createAdminClient } from "@/lib/supabase/admin";
import {
  calculateDynamicPrice,
  findMatchingSpecialRate,
  normalizePricingSetting,
  normalizeSpecialRate,
} from "@/features/pricing/engine";
import type {
  ComputedPricingResult,
  PricingSetting,
  SpecialRate,
  VehicleType,
} from "@/types/pricing";

type RawPricingSettingRow = {
  vehicle_type?: unknown;
  base_fare?: unknown;
  price_per_km?: unknown;
  minimum_fare?: unknown;
  schiphol_surcharge?: unknown;
  night_surcharge?: unknown;
};

type RawSpecialRateRow = {
  id?: unknown;
  from_label?: unknown;
  to_label?: unknown;
  vehicle_type?: unknown;
  fixed_price?: unknown;
  is_active?: unknown;
  sort_order?: unknown;
};

export type PricingData = {
  settings: PricingSetting[];
  rates: SpecialRate[];
};

export type ComputedPriceWithDebug = {
  pricing: ComputedPricingResult;
  debug: {
    settings: PricingSetting[];
    selectedSetting: PricingSetting;
    matchedRate: SpecialRate | null;
  };
};

export async function getPricingData(): Promise<PricingData> {
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
    throw new Error(`pricing_settings fetch failed: ${settingsError.message}`);
  }

  if (ratesError) {
    throw new Error(`special_rates fetch failed: ${ratesError.message}`);
  }

  const normalizedSettings = ((settings ?? []) as RawPricingSettingRow[]).map(
    (row, index) =>
      normalizePricingSetting(row, `pricing_settings[${index}]`)
  );

  const normalizedRates = ((rates ?? []) as RawSpecialRateRow[]).map(
    (row, index) => normalizeSpecialRate(row, `special_rates[${index}]`)
  );

  return {
    settings: normalizedSettings,
    rates: normalizedRates,
  };
}

export async function getComputedPriceWithDebug(params: {
  pickup: string;
  destination: string;
  vehicle: VehicleType;
  pickupHour?: number;
  distanceKm: number;
}): Promise<ComputedPriceWithDebug> {
  const { settings, rates } = await getPricingData();

  const setting = settings.find((item) => item.vehicle_type === params.vehicle);

  if (!setting) {
    throw new Error(`no pricing setting found for vehicle ${params.vehicle}`);
  }

  const matchedRate = findMatchingSpecialRate({
    pickup: params.pickup,
    destination: params.destination,
    vehicle: params.vehicle,
    rates,
  });

  if (matchedRate) {
    if (!Number.isFinite(matchedRate.fixed_price)) {
      throw new Error(
        `special rate invalid: fixed_price is not finite for rate ${matchedRate.id}`
      );
    }

    return {
      pricing: {
        mode: "special",
        total: Number(matchedRate.fixed_price.toFixed(2)),
        matchedRate,
      },
      debug: {
        settings,
        selectedSetting: setting,
        matchedRate,
      },
    };
  }

  const pricing = calculateDynamicPrice({
    settings: setting,
    distanceKm: params.distanceKm,
    pickupHour: params.pickupHour,
    pickup: params.pickup,
    destination: params.destination,
  });

  if (!Number.isFinite(pricing.total)) {
    throw new Error("pricing calculation returned invalid total");
  }

  return {
    pricing,
    debug: {
      settings,
      selectedSetting: setting,
      matchedRate: null,
    },
  };
}

export async function getComputedPrice(params: {
  pickup: string;
  destination: string;
  vehicle: VehicleType;
  pickupHour?: number;
  distanceKm: number;
}): Promise<ComputedPricingResult> {
  const result = await getComputedPriceWithDebug(params);
  return result.pricing;
}
