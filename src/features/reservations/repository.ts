import "server-only";
import { execute, query, queryOne } from "@/lib/db/mysql";
import { toIsoString, toMysqlDateTime, toNullableIsoString } from "@/lib/db/values";
import type { ReservationRecord } from "@/types/reservations";

const RESERVATION_COLUMNS = `id, status, first_name, last_name, email, phone,
       pickup, destination, pickup_date, pickup_time, passengers, vehicle_type,
       notes, distance_km, duration_text, price_total, pricing_mode, admin_note,
       action_token, customer_email_sent_at, status_email_sent_at, confirmed_at,
       rejected_at, created_at, updated_at`;

type RawReservationRow = Omit<
  ReservationRecord,
  | "customer_email_sent_at"
  | "status_email_sent_at"
  | "confirmed_at"
  | "rejected_at"
  | "created_at"
  | "updated_at"
> & {
  customer_email_sent_at: unknown;
  status_email_sent_at: unknown;
  confirmed_at: unknown;
  rejected_at: unknown;
  created_at: unknown;
  updated_at: unknown;
};

/**
 * DATETIME-kolommen komen als Date terug en worden naar ISO-strings omgezet,
 * zodat de rest van de applicatie exact dezelfde waarden ziet als toen de
 * database PostgreSQL `timestamptz` gebruikte.
 */
function mapReservationRow(row: RawReservationRow): ReservationRecord {
  return {
    ...row,
    customer_email_sent_at: toNullableIsoString(row.customer_email_sent_at),
    status_email_sent_at: toNullableIsoString(row.status_email_sent_at),
    confirmed_at: toNullableIsoString(row.confirmed_at),
    rejected_at: toNullableIsoString(row.rejected_at),
    created_at: toIsoString(row.created_at),
    updated_at: toIsoString(row.updated_at),
  };
}

export type InsertReservationInput = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  pickup: string;
  destination: string;
  pickup_date: string;
  pickup_time: string;
  passengers: number;
  vehicle_type: ReservationRecord["vehicle_type"];
  notes: string | null;
  distance_km: number;
  duration_text: string;
  price_total: number;
  pricing_mode: string;
  action_token: string;
};

export async function insertReservation(
  input: InsertReservationInput
): Promise<ReservationRecord> {
  const result = await execute(
    `INSERT INTO reservations
       (status, first_name, last_name, email, phone, pickup, destination,
        pickup_date, pickup_time, passengers, vehicle_type, notes, distance_km,
        duration_text, price_total, pricing_mode, action_token)
     VALUES ('pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.first_name,
      input.last_name,
      input.email,
      input.phone,
      input.pickup,
      input.destination,
      input.pickup_date,
      input.pickup_time,
      input.passengers,
      input.vehicle_type,
      input.notes,
      input.distance_km,
      input.duration_text,
      input.price_total,
      input.pricing_mode,
      input.action_token,
    ]
  );

  const reservation = await selectReservationById(Number(result.insertId));

  if (!reservation) {
    throw new Error("Reservering opslaan mislukt.");
  }

  return reservation;
}

export async function selectReservationById(
  id: number
): Promise<ReservationRecord | null> {
  const row = await queryOne<RawReservationRow>(
    `SELECT ${RESERVATION_COLUMNS} FROM reservations WHERE id = ?`,
    [id]
  );

  return row ? mapReservationRow(row) : null;
}

export async function selectReservationByActionToken(
  token: string
): Promise<ReservationRecord | null> {
  const row = await queryOne<RawReservationRow>(
    `SELECT ${RESERVATION_COLUMNS} FROM reservations WHERE action_token = ?`,
    [token]
  );

  return row ? mapReservationRow(row) : null;
}

export async function selectAllReservations(): Promise<ReservationRecord[]> {
  const rows = await query<RawReservationRow>(
    `SELECT ${RESERVATION_COLUMNS} FROM reservations ORDER BY created_at DESC, id DESC`
  );

  return rows.map(mapReservationRow);
}

export type ReservationStatusUpdate = {
  status: Exclude<ReservationRecord["status"], "pending">;
  admin_note: string | null;
  confirmed_at?: string;
  rejected_at?: string;
  updated_at: string;
};

/**
 * Schrijft alleen de tijdstempel die bij de nieuwe status hoort. Een eerder
 * gezette `rejected_at` of `confirmed_at` blijft staan, precies zoals de
 * Supabase-implementatie deed.
 */
export async function updateReservationStatus(
  id: number,
  payload: ReservationStatusUpdate
): Promise<void> {
  const timestampColumn =
    payload.status === "confirmed" ? "confirmed_at" : "rejected_at";
  const timestampValue =
    payload.status === "confirmed" ? payload.confirmed_at : payload.rejected_at;

  if (!timestampValue) {
    throw new Error(`Missing ${timestampColumn} for status ${payload.status}`);
  }

  await execute(
    `UPDATE reservations
        SET status = ?, admin_note = ?, ${timestampColumn} = ?, updated_at = ?
      WHERE id = ?`,
    [
      payload.status,
      payload.admin_note,
      toMysqlDateTime(timestampValue),
      toMysqlDateTime(payload.updated_at),
      id,
    ]
  );
}

export async function updateReservationEmailTimestamp(params: {
  id: number;
  column: "customer_email_sent_at" | "status_email_sent_at";
  timestamp: string;
}): Promise<void> {
  const sentAt = toMysqlDateTime(params.timestamp);

  await execute(
    `UPDATE reservations SET ${params.column} = ?, updated_at = ? WHERE id = ?`,
    [sentAt, sentAt, params.id]
  );
}

export async function deleteReservation(id: number): Promise<number> {
  const result = await execute(`DELETE FROM reservations WHERE id = ?`, [id]);

  return result.affectedRows;
}

export async function deleteReservationsByIds(ids: number[]): Promise<number> {
  if (ids.length === 0) {
    return 0;
  }

  const placeholders = ids.map(() => "?").join(", ");
  const result = await execute(
    `DELETE FROM reservations WHERE id IN (${placeholders})`,
    ids
  );

  return result.affectedRows;
}

export async function deleteAllReservations(): Promise<number> {
  const result = await execute(`DELETE FROM reservations`);

  return result.affectedRows;
}
