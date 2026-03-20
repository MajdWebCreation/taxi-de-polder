import { getRouteQuoteFromGoogle } from "@/lib/google/routes";
import { getComputedPriceWithDebug } from "@/features/pricing/service";
import type { VehicleType } from "@/types/pricing";

export async function getQuote(params: {
  pickup: string;
  destination: string;
  vehicle: VehicleType;
  pickupHour?: number;
}) {
  const route = await getRouteQuoteFromGoogle({
    origin: params.pickup,
    destination: params.destination,
  });

  const pricingResult = await getComputedPriceWithDebug({
    pickup: params.pickup,
    destination: params.destination,
    vehicle: params.vehicle,
    pickupHour: params.pickupHour,
    distanceKm: route.distanceKm,
  });

  return {
    route,
    pricing: pricingResult.pricing,
    debug: pricingResult.debug,
  };
}
