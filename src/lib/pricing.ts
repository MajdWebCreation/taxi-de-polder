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

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
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

  return params.rates
    .filter((rate) => rate.is_active && rate.vehicle_type === params.vehicle)
    .sort((a, b) => a.sort_order - b.sort_order)
    .find((rate) => {
      const fromLabel = normalize(rate.from_label);
      const toLabel = normalize(rate.to_label);

      return pickup.includes(fromLabel) && destination.includes(toLabel);
    });
}

export function calculateDynamicPrice(params: {
  settings: PricingSetting;
  distanceKm: number;
  pickupHour?: number;
  pickup: string;
  destination: string;
}) {
  const { settings, distanceKm, pickupHour, pickup, destination } = params;

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

  return {
    mode: "dynamic" as const,
    distanceKm,
    total: Number(total.toFixed(2)),
    minimumFare: settings.minimum_fare,
    baseFare: settings.base_fare,
    schipholApplied: isSchiphol,
    nightApplied: typeof pickupHour === "number" ? isNightRide(pickupHour) : false,
  };
}