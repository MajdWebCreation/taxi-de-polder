import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage, getErrorStatus } from "@/lib/google-env";
import { getRouteQuoteFromGoogle } from "@/lib/google-routes";
import { getComputedPrice } from "@/lib/pricing-store";
import type { VehicleType } from "@/lib/pricing";

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

    const route = await getRouteQuoteFromGoogle({
      origin: pickup,
      destination,
    });

    const pickupHour =
      pickupHourRaw !== "" && !Number.isNaN(Number(pickupHourRaw))
        ? Number(pickupHourRaw)
        : undefined;

    const pricing = await getComputedPrice({
      pickup,
      destination,
      vehicle,
      pickupHour,
      distanceKm: route.distanceKm,
    });

    return NextResponse.json({
      success: true,
      route,
      pricing,
    });
  } catch (error) {
    const message = getErrorMessage(
      error,
      "Onbekende fout bij prijsberekening."
    );
    const status = getErrorStatus(error);

    return NextResponse.json({ error: message }, { status });
  }
}
