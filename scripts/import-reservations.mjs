/**
 * Importeert reserveringen uit een JSON-export van de oude Supabase-database
 * in MySQL. IDs, statussen en timestamps blijven exact behouden; bestaande
 * rijen worden nooit overschreven (INSERT IGNORE).
 *
 * De export is een JSON-array met de kolommen van public.reservations, bijv.
 * gemaakt met:  select json_agg(r) from public.reservations r;
 *
 * Gebruik:
 *   node --env-file=.env.local scripts/import-reservations.mjs <pad/naar/export.json>
 */
import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

function requireEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    console.error(`Ontbrekende environment variable: ${name}`);
    process.exit(1);
  }

  return value;
}

/** PostgreSQL timestamptz -> UTC Date, die mysql2 als DATETIME(3) wegschrijft. */
function toDate(value) {
  if (value === null || value === undefined || value === "") return null;

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Ongeldige timestamp: ${value}`);
  }

  return parsed;
}

const [, , filePath] = process.argv;

if (!filePath) {
  console.error(
    "Gebruik: node --env-file=.env.local scripts/import-reservations.mjs <export.json>"
  );
  process.exit(1);
}

const rows = JSON.parse(await readFile(filePath, "utf8"));

if (!Array.isArray(rows)) {
  console.error("Export moet een JSON-array van reserveringen zijn.");
  process.exit(1);
}

const connection = await mysql.createConnection({
  host: requireEnv("DB_HOST"),
  port: Number(process.env.DB_PORT?.trim() || 3306),
  database: requireEnv("DB_NAME"),
  user: requireEnv("DB_USER"),
  password: requireEnv("DB_PASSWORD"),
  ssl:
    process.env.DB_SSL?.trim().toLowerCase() === "true"
      ? { minVersion: "TLSv1.2" }
      : undefined,
  timezone: "Z",
});

try {
  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const [result] = await connection.execute(
      `INSERT IGNORE INTO reservations
         (id, status, first_name, last_name, email, phone, pickup, destination,
          pickup_date, pickup_time, passengers, vehicle_type, notes, distance_km,
          duration_text, price_total, pricing_mode, admin_note, action_token,
          customer_email_sent_at, status_email_sent_at, confirmed_at, rejected_at,
          created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id,
        row.status,
        row.first_name,
        row.last_name,
        row.email,
        row.phone,
        row.pickup,
        row.destination,
        String(row.pickup_date).slice(0, 10),
        row.pickup_time,
        row.passengers,
        row.vehicle_type,
        row.notes ?? null,
        row.distance_km,
        row.duration_text,
        row.price_total,
        row.pricing_mode,
        row.admin_note ?? null,
        row.action_token,
        toDate(row.customer_email_sent_at),
        toDate(row.status_email_sent_at),
        toDate(row.confirmed_at),
        toDate(row.rejected_at),
        toDate(row.created_at),
        toDate(row.updated_at),
      ]
    );

    if (result.affectedRows === 1) inserted += 1;
    else skipped += 1;
  }

  const [[{ total }]] = await connection.query(
    `SELECT COUNT(*) AS total FROM reservations`
  );

  console.log(`Export bevat: ${rows.length}`);
  console.log(`Geïmporteerd: ${inserted}`);
  console.log(`Al aanwezig (overgeslagen): ${skipped}`);
  console.log(`Totaal in MySQL: ${total}`);
} finally {
  await connection.end();
}
