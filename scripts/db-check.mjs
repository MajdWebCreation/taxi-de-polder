/**
 * Diagnose van de databaseverbinding: TLS, versie, rechten, tijdzone en de
 * staat van het schema. Handig bij het opzetten van een nieuwe omgeving en om
 * na een wijziging te bevestigen dat productie nog gezond is.
 *
 * Gebruik:
 *   node --env-file=.env.local scripts/db-check.mjs
 */
import mysql from "mysql2/promise";

const EXPECTED_TABLES = [
  "admin_sessions",
  "admin_users",
  "pricing_settings",
  "reservations",
  "schema_migrations",
  "special_rates",
];

function requireEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    console.error(`Ontbrekende environment variable: ${name}`);
    process.exit(1);
  }

  return value;
}

const useSsl = process.env.DB_SSL?.trim().toLowerCase() === "true";

const connection = await mysql.createConnection({
  host: requireEnv("DB_HOST"),
  port: Number(process.env.DB_PORT?.trim() || 3306),
  database: requireEnv("DB_NAME"),
  user: requireEnv("DB_USER"),
  password: requireEnv("DB_PASSWORD"),
  // Zelfde TLS-instellingen als de applicatiepool in src/lib/db/mysql.ts.
  ssl: useSsl
    ? { minVersion: "TLSv1.2", rejectUnauthorized: true, verifyIdentity: true }
    : undefined,
  timezone: "Z",
});

const one = async (sql) => (await connection.query(sql))[0][0];
const all = async (sql) => (await connection.query(sql))[0];

try {
  const cipher = await one("SHOW STATUS LIKE 'Ssl_cipher'");
  const version = await one("SHOW STATUS LIKE 'Ssl_version'");

  console.log("Verbinding");
  console.log("  host        :", process.env.DB_HOST);
  console.log("  database    :", (await one("SELECT DATABASE() d")).d);
  console.log("  gebruiker   :", (await one("SELECT CURRENT_USER() u")).u);
  console.log("  server      :", (await one("SELECT VERSION() v")).v);
  console.log("  TLS cipher  :", cipher?.Value || "(geen TLS)");
  console.log("  TLS versie  :", version?.Value || "(geen TLS)");

  const tz = await one(
    "SELECT @@session.time_zone tz, UTC_TIMESTAMP(3) utc, NOW(3) now3"
  );
  console.log("\nTijd");
  console.log("  session tz  :", tz.tz);
  console.log("  UTC_TIMESTAMP:", tz.utc);
  console.log("  NOW()       :", tz.now3);
  console.log(
    "  UTC == NOW  :",
    String(tz.utc) === String(tz.now3) ? "ja" : "NEE - controleer de tijdzone"
  );

  console.log("\nRechten");
  for (const row of await all("SHOW GRANTS")) {
    console.log("  ", Object.values(row)[0]);
  }

  const tables = (
    await all(
      `SELECT TABLE_NAME AS name FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME`
    )
  ).map((row) => row.name);

  console.log("\nTabellen");
  for (const name of EXPECTED_TABLES) {
    console.log(`  ${tables.includes(name) ? "aanwezig  " : "ONTBREEKT "} ${name}`);
  }
  for (const name of tables.filter((n) => !EXPECTED_TABLES.includes(n))) {
    console.log(`  extra      ${name}`);
  }

  if (tables.includes("schema_migrations")) {
    console.log("\nMigraties");
    for (const row of await all(
      "SELECT name, applied_at FROM schema_migrations ORDER BY name"
    )) {
      console.log(`   ${row.name}  (${row.applied_at.toISOString()})`);
    }
  }

  console.log("\nRijen");
  for (const name of ["pricing_settings", "special_rates", "reservations", "admin_users", "admin_sessions"]) {
    if (!tables.includes(name)) continue;
    const { total } = await one(`SELECT COUNT(*) AS total FROM \`${name}\``);
    console.log(`  ${String(total).padStart(5)}  ${name}`);
  }
} finally {
  await connection.end();
}
