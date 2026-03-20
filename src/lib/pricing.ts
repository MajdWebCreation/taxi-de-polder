export type VehicleType = "auto" | "busje";

export type PricingSetting = {
  vehicle_type: VehicleType;
  base_fare: number;
  price_per_km: number;
  minimum_fare: number;
  schiphol_surcharge: number;
  night_surcharge: number;
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
  total: number;
  minimumFare: number;
  baseFare: number;
  schipholApplied: boolean;
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

type RawPricingSetting = {
  vehicle_type?: unknown;
  base_fare?: unknown;
  price_per_km?: unknown;
  minimum_fare?: unknown;
  schiphol_surcharge?: unknown;
  night_surcharge?: unknown;
};

type RawSpecialRate = {
  id?: unknown;
  from_label?: unknown;
  to_label?: unknown;
  vehicle_type?: unknown;
  fixed_price?: unknown;
  is_active?: unknown;
  sort_order?: unknown;
};

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function parseRequiredNumber(value: unknown, fieldName: string): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldName} normalization failed: expected a finite number`);
  }

  return parsed;
}

function parseRequiredString(value: unknown, fieldName: string): string {
  const parsed = String(value ?? "").trim();

  if (!parsed) {
    throw new Error(`${fieldName} normalization failed: expected a non-empty string`);
  }

  return parsed;
}

function parseVehicleType(value: unknown, fieldName: string): VehicleType {
  const parsed = String(value ?? "").trim();

  if (parsed === "auto" || parsed === "busje") {
    return parsed;
  }

  throw new Error(
    `${fieldName} normalization failed: expected "auto" or "busje"`
  );
}

function parseBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  throw new Error(`${fieldName} normalization failed: expected a boolean`);
}

export function normalizePricingSetting(
  row: RawPricingSetting,
  context = "pricing_settings row"
): PricingSetting {
  return {
    vehicle_type: parseVehicleType(row.vehicle_type, `${context}.vehicle_type`),
    base_fare: parseRequiredNumber(row.base_fare, `${context}.base_fare`),
    price_per_km: parseRequiredNumber(
      row.price_per_km,
      `${context}.price_per_km`
    ),
    minimum_fare: parseRequiredNumber(
      row.minimum_fare,
      `${context}.minimum_fare`
    ),
    schiphol_surcharge: parseRequiredNumber(
      row.schiphol_surcharge,
      `${context}.schiphol_surcharge`
    ),
    night_surcharge: parseRequiredNumber(
      row.night_surcharge,
      `${context}.night_surcharge`
    ),
  };
}

export function normalizeSpecialRate(
  row: RawSpecialRate,
  context = "special_rates row"
): SpecialRate {
  const normalizedRate: SpecialRate = {
    id: parseRequiredNumber(row.id, `${context}.id`),
    from_label: parseRequiredString(row.from_label, `${context}.from_label`),
    to_label: parseRequiredString(row.to_label, `${context}.to_label`),
    vehicle_type: parseVehicleType(row.vehicle_type, `${context}.vehicle_type`),
    fixed_price: parseRequiredNumber(row.fixed_price, `${context}.fixed_price`),
    is_active: parseBoolean(row.is_active, `${context}.is_active`),
    sort_order: parseRequiredNumber(row.sort_order, `${context}.sort_order`),
  };

  if (!Number.isFinite(normalizedRate.fixed_price)) {
    throw new Error(`${context} invalid: fixed_price is not finite`);
  }

  return normalizedRate;
}

export function isNightRide(hour: number) {
  return hour >= 23 || hour < 6;
}

export function findMatchingSpecialRate(params: {
  pickup: string;
  destination: string;
  vehicle: VehicleType;
  rates: SpecialRate[];
}) {
  const pickup = normalize(params.pickup);
  const destination = normalize(params.destination);

  return (
    params.rates
      .filter((rate) => rate.is_active && rate.vehicle_type === params.vehicle)
      .sort((a, b) => a.sort_order - b.sort_order)
      .find((rate) => {
        const fromLabel = normalize(rate.from_label);
        const toLabel = normalize(rate.to_label);

        if (!fromLabel || !toLabel) {
          throw new Error(
            `special rate invalid: missing from_label or to_label for rate ${rate.id}`
          );
        }

        return pickup.includes(fromLabel) && destination.includes(toLabel);
      }) ?? null
  );
}

export function calculateDynamicPrice(params: {
  settings: PricingSetting;
  distanceKm: number;
  pickupHour?: number;
  pickup: string;
  destination: string;
}): DynamicPricingResult {
  const { settings, distanceKm, pickupHour, pickup, destination } = params;

  if (!Number.isFinite(distanceKm)) {
    throw new Error("pricing calculation failed: distanceKm is not a finite number");
  }

  const lowerHaystack = `${pickup} ${destination}`.toLowerCase();
  const isSchiphol =
    lowerHaystack.includes("schiphol") ||
    lowerHaystack.includes("airport") ||
    lowerHaystack.includes("ams");

  let total = settings.base_fare + distanceKm * settings.price_per_km;

  if (isSchiphol) {
    total += settings.schiphol_surcharge;
  }

  if (typeof pickupHour === "number" && isNightRide(pickupHour)) {
    total += settings.night_surcharge;
  }

  total = Math.max(total, settings.minimum_fare);

  if (!Number.isFinite(total)) {
    throw new Error("pricing calculation returned invalid total");
  }

  return {
    mode: "dynamic",
    distanceKm,
    total: Number(total.toFixed(2)),
    minimumFare: settings.minimum_fare,
    baseFare: settings.base_fare,
    schipholApplied: isSchiphol,
    nightApplied:
      typeof pickupHour === "number" ? isNightRide(pickupHour) : false,
  };
}
