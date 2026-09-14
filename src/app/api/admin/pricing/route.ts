import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdminUser } from "@/features/auth/require-admin";
import {
  savePricing,
  type PricingSettingUpdate,
  type SpecialRateUpsert,
} from "@/features/pricing/repository";
import type { VehicleType } from "@/types/pricing";

function parseFiniteNumber(value: unknown, label: string): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} moet een geldig getal zijn.`);
  }

  return parsed;
}

function parseVehicleType(value: unknown): VehicleType {
  if (value === "auto" || value === "busje") {
    return value;
  }

  throw new Error("Voertuig moet auto of busje zijn.");
}

function parseSettings(value: unknown): PricingSettingUpdate[] {
  if (!Array.isArray(value)) {
    throw new Error("Tarieven ontbreken.");
  }

  return value.map((raw) => {
    const item = raw as Record<string, unknown>;
    const id = parseFiniteNumber(item.id, "Tarief-ID");

    if (id <= 0) {
      throw new Error("Tarief-ID is ongeldig.");
    }

    return {
      id,
      base_fare: parseFiniteNumber(item.base_fare, "Starttarief"),
      price_per_km: parseFiniteNumber(item.price_per_km, "Prijs per km"),
      price_per_minute: parseFiniteNumber(
        item.price_per_minute,
        "Prijs per minuut"
      ),
      minimum_fare: parseFiniteNumber(item.minimum_fare, "Minimumprijs"),
      night_surcharge: parseFiniteNumber(item.night_surcharge, "Nachttoeslag"),
    };
  });
}

function parseRates(value: unknown): SpecialRateUpsert[] {
  if (!Array.isArray(value)) {
    throw new Error("Speciale tarieven ontbreken.");
  }

  return value.map((raw) => {
    const item = raw as Record<string, unknown>;
    const fromLabel = String(item.from_label ?? "").trim();
    const toLabel = String(item.to_label ?? "").trim();

    if (!fromLabel || !toLabel) {
      throw new Error("Vul bij elk vast tarief zowel 'Van' als 'Naar' in.");
    }

    return {
      id: parseFiniteNumber(item.id, "Vast tarief-ID"),
      from_label: fromLabel,
      to_label: toLabel,
      vehicle_type: parseVehicleType(item.vehicle_type),
      fixed_price: parseFiniteNumber(item.fixed_price, "Vaste prijs"),
      is_active: item.is_active === true,
      sort_order: parseFiniteNumber(item.sort_order, "Sorteervolgorde"),
    };
  });
}

export async function PUT(request: NextRequest) {
  const admin = await getAuthenticatedAdminUser();

  if (!admin) {
    return NextResponse.json({ error: "Niet geautoriseerd." }, { status: 401 });
  }

  let settings: PricingSettingUpdate[];
  let rates: SpecialRateUpsert[];

  try {
    const body = (await request.json()) as {
      settings?: unknown;
      rates?: unknown;
    };

    settings = parseSettings(body.settings);
    rates = parseRates(body.rates);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Ongeldige tarieven.",
      },
      { status: 400 }
    );
  }

  try {
    await savePricing({ settings, rates });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Opslaan mislukt.",
      },
      { status: 500 }
    );
  }
}
