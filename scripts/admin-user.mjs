/**
 * Beheer van de beheerdersaccounts in MySQL. Vervangt de vorige variant die
 * Supabase Auth gebruikte.
 *
 * Gebruik:
 *   node --env-file=.env.local scripts/admin-user.mjs create <email> <wachtwoord>
 *   node --env-file=.env.local scripts/admin-user.mjs set-password <email> <wachtwoord>
 *   node --env-file=.env.local scripts/admin-user.mjs delete <email>
 *   node --env-file=.env.local scripts/admin-user.mjs list
 */
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import mysql from "mysql2/promise";

const scryptAsync = promisify(scrypt);

// Moet exact overeenkomen met src/features/auth/password.ts.
const SCRYPT_COST = 2 ** 15;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const MAX_MEMORY = 64 * 1024 * 1024;

async function hashPassword(password) {
  const salt = randomBytes(SALT_LENGTH);
  const derivedKey = await scryptAsync(password.normalize("NFKC"), salt, KEY_LENGTH, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
    maxmem: MAX_MEMORY,
  });

  return [
    "scrypt",
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
    salt.toString("base64"),
    derivedKey.toString("base64"),
  ].join("$");
}

function requireEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    console.error(`Ontbrekende environment variable: ${name}`);
    process.exit(1);
  }

  return value;
}

function assertPassword(password) {
  if (!password || password.length < 12) {
    throw new Error("Wachtwoord moet minimaal 12 tekens lang zijn.");
  }
}

const [, , command, rawEmail, password] = process.argv;
const email = rawEmail?.trim().toLowerCase();

if (!command) {
  console.error(
    [
      "Gebruik:",
      "  node --env-file=.env.local scripts/admin-user.mjs create <email> <wachtwoord>",
      "  node --env-file=.env.local scripts/admin-user.mjs set-password <email> <wachtwoord>",
      "  node --env-file=.env.local scripts/admin-user.mjs delete <email>",
      "  node --env-file=.env.local scripts/admin-user.mjs list",
    ].join("\n")
  );
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
  if (command === "list") {
    const [rows] = await connection.query(
      `SELECT id, email, created_at FROM admin_users ORDER BY id`
    );

    if (rows.length === 0) {
      console.log("Geen beheerders gevonden.");
    } else {
      for (const row of rows) {
        console.log(`#${row.id}  ${row.email}  (aangemaakt ${row.created_at.toISOString()})`);
      }
    }
  } else if (command === "create") {
    if (!email) throw new Error("E-mailadres ontbreekt.");
    assertPassword(password);

    const [existing] = await connection.query(
      `SELECT id FROM admin_users WHERE email = ?`,
      [email]
    );

    if (existing.length > 0) {
      throw new Error(`Er bestaat al een beheerder met e-mailadres ${email}`);
    }

    await connection.execute(
      `INSERT INTO admin_users (email, password_hash) VALUES (?, ?)`,
      [email, await hashPassword(password)]
    );

    console.log(`Beheerder aangemaakt: ${email}`);
  } else if (command === "set-password") {
    if (!email) throw new Error("E-mailadres ontbreekt.");
    assertPassword(password);

    const [result] = await connection.execute(
      `UPDATE admin_users SET password_hash = ?, updated_at = UTC_TIMESTAMP(3) WHERE email = ?`,
      [await hashPassword(password), email]
    );

    if (result.affectedRows === 0) {
      throw new Error(`Geen beheerder gevonden voor ${email}`);
    }

    // Bestaande sessies intrekken na een wachtwoordwijziging.
    await connection.execute(
      `DELETE s FROM admin_sessions s
         JOIN admin_users u ON u.id = s.admin_user_id
        WHERE u.email = ?`,
      [email]
    );

    console.log(`Wachtwoord bijgewerkt en sessies ingetrokken: ${email}`);
  } else if (command === "delete") {
    if (!email) throw new Error("E-mailadres ontbreekt.");

    const [result] = await connection.execute(
      `DELETE FROM admin_users WHERE email = ?`,
      [email]
    );

    if (result.affectedRows === 0) {
      throw new Error(`Geen beheerder gevonden voor ${email}`);
    }

    console.log(`Beheerder verwijderd: ${email}`);
  } else {
    throw new Error(`Onbekend commando: ${command}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Onbekende fout");
  process.exitCode = 1;
} finally {
  await connection.end();
}
