import {
  selectPricingSettings,
  selectSpecialRates,
} from "@/features/pricing/repository";
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
  const [settings, rates] = await Promise.all([
    selectPricingSettings(),
    selectSpecialRates(),
  ]);

  const normalizedSettings = settings.map((row, index) =>
    normalizePricingSetting(row, `pricing_settings[${index}]`)
  );

  const normalizedRates = rates.map((row, index) =>
    normalizeSpecialRate(row, `special_rates[${index}]`)
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
  durationMinutes: number;
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
    durationMinutes: params.durationMinutes,
    pickupHour: params.pickupHour,
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
  durationMinutes: number;
}): Promise<ComputedPricingResult> {
  const result = await getComputedPriceWithDebug(params);
  return result.pricing;
}
