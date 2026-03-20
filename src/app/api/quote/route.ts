import { NextRequest, NextResponse } from "next/server";
import {
  getErrorMessage,
  getErrorStatus,
  GoogleApiError,
} from "@/lib/google/env";
import { getQuote } from "@/features/pricing/quote-service";
import type { VehicleType } from "@/types/pricing";

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

    const pickupHour =
      pickupHourRaw !== "" && !Number.isNaN(Number(pickupHourRaw))
        ? Number(pickupHourRaw)
        : undefined;

    try {
      const quote = await getQuote({
        pickup,
        destination,
        vehicle,
        pickupHour,
      });

      console.log("[quote] route result", quote.route);
      console.log("[quote] normalized pricing settings", quote.debug.settings);
      console.log("[quote] matched special rate", quote.debug.matchedRate);
      console.log("[quote] final pricing result", quote.pricing);

      return NextResponse.json({
        success: true,
        route: quote.route,
        pricing: quote.pricing,
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
