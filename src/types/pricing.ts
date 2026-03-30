export type VehicleType = "auto" | "busje";

export type PricingSetting = {
  vehicle_type: VehicleType;
  base_fare: number;
  price_per_km: number;
  price_per_minute: number;
  minimum_fare: number;
  night_surcharge: number;
};

export type PricingSettingRecord = PricingSetting & {
  id: number;
};

export type SpecialRate = {
  id: number;
  from_label: string;
  to_label: string;
  vehicle_type: VehicleType;
  fixed_price: number;
  is_active: boolean;
  sort_order: number;
};

export type DynamicPricingResult = {
  mode: "dynamic";
  distanceKm: number;
  durationMinutes: number;
  total: number;
  minimumFare: number;
  baseFare: number;
  pricePerKm: number;
  pricePerMinute: number;
  nightApplied: boolean;
};

export type SpecialPricingResult = {
  mode: "special";
  total: number;
  matchedRate: SpecialRate;
};

export type ComputedPricingResult =
  | DynamicPricingResult
  | SpecialPricingResult;
