import { NextRequest, NextResponse } from "next/server";
import {
  getErrorMessage,
  getErrorStatus,
  GoogleApiError,
} from "@/lib/google-env";
import { getRouteQuoteFromGoogle } from "@/lib/google-routes";
import { getComputedPriceWithDebug } from "@/lib/pricing-store";
import type { VehicleType } from "@/lib/pricing";

function createStageError(step: string, error: unknown): GoogleApiError {
  const message = getErrorMessage(error, `${step} failed`);
  const status = getErrorStatus(error);
  return new GoogleApiError(`${step}: ${message}`, status);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      pickup?: unknown;
      destination?: unknown;
      pickupHour?: unknown;
      vehicle?: unknown;
    };

    const pickup = String(body.pickup ?? "").trim();
    const destination = String(body.destination ?? "").trim();
    const pickupHourRaw = String(body.pickupHour ?? "").trim();
    const vehicle = String(body.vehicle ?? "") as VehicleType;

    if (!pickup || !destination) {
      return NextResponse.json(
        { error: "Pickup en destination zijn verplicht." },
        { status: 400 }
      );
    }

    if (vehicle !== "auto" && vehicle !== "busje") {
      return NextResponse.json(
        { error: "Voertuig moet auto of busje zijn." },
        { status: 400 }
      );
    }

    console.log("[quote] selected vehicle", { vehicle });

    let route;
    try {
      route = await getRouteQuoteFromGoogle({
        origin: pickup,
        destination,
      });
      console.log("[quote] route result", route);
    } catch (error) {
      throw createStageError("route lookup failed", error);
    }

    const pickupHour =
      pickupHourRaw !== "" && !Number.isNaN(Number(pickupHourRaw))
        ? Number(pickupHourRaw)
        : undefined;

    try {
      const pricingResult = await getComputedPriceWithDebug({
        pickup,
        destination,
        vehicle,
        pickupHour,
        distanceKm: route.distanceKm,
      });

      console.log(
        "[quote] normalized pricing settings",
        pricingResult.debug.settings
      );
      console.log(
        "[quote] matched special rate",
        pricingResult.debug.matchedRate
      );
      console.log("[quote] final pricing result", pricingResult.pricing);

      return NextResponse.json({
        success: true,
        route,
        pricing: pricingResult.pricing,
      });
    } catch (error) {
      throw createStageError("pricing calculation failed", error);
    }
  } catch (error) {
    const message = getErrorMessage(error, "Onbekende fout bij prijsberekening.");
    const status = getErrorStatus(error);

    console.error("[quote] request failed", {
      status,
      message,
      error,
    });

    return NextResponse.json({ error: message }, { status });
  }
}
