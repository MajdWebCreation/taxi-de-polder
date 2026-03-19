export type VehicleType = "auto" | "busje";

type PricingConfig = {
  baseFare: number;
  pricePerKm: number;
  minimumFare: number;
  schipholSurcharge: number;
  nightSurcharge: number;
};

const VEHICLE_PRICING: Record<VehicleType, PricingConfig> = {
  auto: {
    baseFare: 12,
    pricePerKm: 2.35,
    minimumFare: 25,
    schipholSurcharge: 7,
    nightSurcharge: 10,
  },
  busje: {
    baseFare: 20,
    pricePerKm: 3.25,
    minimumFare: 40,
    schipholSurcharge: 10,
    nightSurcharge: 15,
  },
};

export function isNightRide(hour: number) {
  return hour >= 23 || hour < 6;
}

export function isSchipholRoute(pickup: string, destination: string) {
  const haystack = `${pickup} ${destination}`.toLowerCase();
  return (
    haystack.includes("schiphol") ||
    haystack.includes("airport") ||
    haystack.includes("ams")
  );
}

export function calculatePrice(params: {
  distanceKm: number;
  vehicle: VehicleType;
  pickup: string;
  destination: string;
  pickupHour?: number;
}) {
  const { distanceKm, vehicle, pickup, destination, pickupHour } = params;
  const config = VEHICLE_PRICING[vehicle];

  let total = config.baseFare + distanceKm * config.pricePerKm;

  if (isSchipholRoute(pickup, destination)) {
    total += config.schipholSurcharge;
  }

  if (typeof pickupHour === "number" && isNightRide(pickupHour)) {
    total += config.nightSurcharge;
  }

  total = Math.max(total, config.minimumFare);

  return {
    baseFare: config.baseFare,
    minimumFare: config.minimumFare,
    distanceKm,
    subtotal: Number((config.baseFare + distanceKm * config.pricePerKm).toFixed(2)),
    schipholApplied: isSchipholRoute(pickup, destination),
    nightApplied: typeof pickupHour === "number" ? isNightRide(pickupHour) : false,
    total: Number(total.toFixed(2)),
  };
}