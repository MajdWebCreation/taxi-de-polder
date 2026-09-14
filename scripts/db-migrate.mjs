/**
 * Past de SQL-bestanden in db/migrations in volgorde toe op de MySQL-database
 * en houdt in de tabel `schema_migrations` bij wat al gedraaid heeft.
 *
 * Gebruik:
 *   node --env-file=.env.local scripts/db-migrate.mjs
 *   node --env-file=.env.local scripts/db-migrate.mjs --status
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const MIGRATIONS_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "db",
  "migrations"
);

function requireEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    console.error(`Ontbrekende environment variable: ${name}`);
    process.exit(1);
  }

  return value;
}

/**
 * Splitst een migratiebestand op statements. De migraties bevatten bewust geen
 * stored procedures of triggers, dus een simpele splitsing op `;` buiten
 * strings en commentaar volstaat.
 */
function splitStatements(sql) {
  const statements = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let inLineComment = false;

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index];
    const next = sql[index + 1];

    if (inLineComment) {
      if (char === "\n") {
        inLineComment = false;
        current += char;
      }
      continue;
    }

    if (!inSingle && !inDouble && !inBacktick && char === "-" && next === "-") {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (char === "'" && !inDouble && !inBacktick) inSingle = !inSingle;
    else if (char === '"' && !inSingle && !inBacktick) inDouble = !inDouble;
    else if (char === "`" && !inSingle && !inDouble) inBacktick = !inBacktick;

    if (char === ";" && !inSingle && !inDouble && !inBacktick) {
      if (current.trim()) statements.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) statements.push(current.trim());

  return statements;
}

async function main() {
  const statusOnly = process.argv.includes("--status");

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
    multipleStatements: false,
  });

  try {
    await connection.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         name VARCHAR(255) NOT NULL,
         applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
         PRIMARY KEY (name)
       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );

    const [appliedRows] = await connection.query(
      `SELECT name FROM schema_migrations ORDER BY name`
    );
    const applied = new Set(appliedRows.map((row) => row.name));

    const files = (await readdir(MIGRATIONS_DIR))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    if (statusOnly) {
      for (const file of files) {
        console.log(`${applied.has(file) ? "toegepast" : "openstaand"}  ${file}`);
      }
      return;
    }

    let appliedCount = 0;

    for (const file of files) {
      if (applied.has(file)) continue;

      const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");

      for (const statement of splitStatements(sql)) {
        await connection.query(statement);
      }

      await connection.query(
        `INSERT INTO schema_migrations (name) VALUES (?)`,
        [file]
      );

      console.log(`Toegepast: ${file}`);
      appliedCount += 1;
    }

    console.log(
      appliedCount === 0
        ? "Database is up-to-date."
        : `${appliedCount} migratie(s) toegepast.`
    );
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
