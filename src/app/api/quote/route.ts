import { NextRequest, NextResponse } from "next/server";
import { getRouteQuoteFromGoogle } from "@/lib/google-routes";
import { calculatePrice, type VehicleType } from "@/lib/pricing";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

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

    const pricing = calculatePrice({
      distanceKm: route.distanceKm,
      vehicle,
      pickup,
      destination,
      pickupHour,
    });

    return NextResponse.json({
      success: true,
      route,
      pricing,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Onbekende fout bij prijsberekening";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}