import "server-only";
import { query, withTransaction } from "@/lib/db/mysql";
import { toBoolean } from "@/lib/db/values";
import type { VehicleType } from "@/types/pricing";

export type PricingSettingRow = {
  id: number;
  vehicle_type: VehicleType;
  base_fare: string;
  price_per_km: string;
  price_per_minute: string;
  minimum_fare: string;
  night_surcharge: string;
};

export type SpecialRateRow = {
  id: number;
  from_label: string;
  to_label: string;
  vehicle_type: VehicleType;
  fixed_price: string;
  is_active: boolean;
  sort_order: number;
};

type RawSpecialRateRow = Omit<SpecialRateRow, "is_active"> & {
  is_active: unknown;
};

/**
 * Zelfde sortering als de vorige Supabase-query:
 * pricing_settings op vehicle_type, special_rates op sort_order en daarna id.
 */
export async function selectPricingSettings(): Promise<PricingSettingRow[]> {
  return query<PricingSettingRow>(
    `SELECT id, vehicle_type, base_fare, price_per_km, price_per_minute,
            minimum_fare, night_surcharge
       FROM pricing_settings
      ORDER BY vehicle_type ASC`
  );
}

export async function selectSpecialRates(): Promise<SpecialRateRow[]> {
  const rows = await query<RawSpecialRateRow>(
    `SELECT id, from_label, to_label, vehicle_type, fixed_price, is_active,
            sort_order
       FROM special_rates
      ORDER BY sort_order ASC, id ASC`
  );

  return rows.map((row) => ({ ...row, is_active: toBoolean(row.is_active) }));
}

export type PricingSettingUpdate = {
  id: number;
  base_fare: number;
  price_per_km: number;
  price_per_minute: number;
  minimum_fare: number;
  night_surcharge: number;
};

export type SpecialRateUpsert = {
  /** Negatief of afwezig voor een nieuw tarief. */
  id: number;
  from_label: string;
  to_label: string;
  vehicle_type: VehicleType;
  fixed_price: number;
  is_active: boolean;
  sort_order: number;
};

/**
 * Slaat het complete tarievenscherm in één transactie op: tarieven die de
 * beheerder verwijderd heeft verdwijnen, bestaande worden bijgewerkt en
 * nieuwe (id <= 0) worden toegevoegd. Dit is dezelfde bewerking die het
 * adminpaneel voorheen als losse browser-calls naar Supabase deed.
 */
export async function savePricing(params: {
  settings: PricingSettingUpdate[];
  rates: SpecialRateUpsert[];
}): Promise<void> {
  await withTransaction(async (connection) => {
    const now = new Date();

    for (const setting of params.settings) {
      await connection.execute(
        `UPDATE pricing_settings
            SET base_fare = ?, price_per_km = ?, price_per_minute = ?,
                minimum_fare = ?, night_surcharge = ?, updated_at = ?
          WHERE id = ?`,
        [
          setting.base_fare,
          setting.price_per_km,
          setting.price_per_minute,
          setting.minimum_fare,
          setting.night_surcharge,
          now,
          setting.id,
        ]
      );
    }

    const keptIds = params.rates
      .filter((rate) => rate.id > 0)
      .map((rate) => rate.id);

    if (keptIds.length > 0) {
      await connection.query(
        `DELETE FROM special_rates WHERE id NOT IN (?)`,
        [keptIds]
      );
    } else {
      await connection.query(`DELETE FROM special_rates`);
    }

    for (const rate of params.rates) {
      if (rate.id > 0) {
        await connection.execute(
          `UPDATE special_rates
              SET from_label = ?, to_label = ?, vehicle_type = ?,
                  fixed_price = ?, is_active = ?, sort_order = ?, updated_at = ?
            WHERE id = ?`,
          [
            rate.from_label,
            rate.to_label,
            rate.vehicle_type,
            rate.fixed_price,
            rate.is_active ? 1 : 0,
            rate.sort_order,
            now,
            rate.id,
          ]
        );
      } else {
        await connection.execute(
          `INSERT INTO special_rates
             (from_label, to_label, vehicle_type, fixed_price, is_active, sort_order)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            rate.from_label,
            rate.to_label,
            rate.vehicle_type,
            rate.fixed_price,
            rate.is_active ? 1 : 0,
            rate.sort_order,
          ]
        );
      }
    }
  });
}

