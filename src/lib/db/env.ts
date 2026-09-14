export type DatabaseConfig = {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
  connectionLimit: number;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parsePositiveInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();

  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid environment variable ${name}: expected a positive integer`);
  }

  return parsed;
}

function parseBooleanEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();

  if (!raw) {
    return fallback;
  }

  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;

  throw new Error(`Invalid environment variable ${name}: expected true or false`);
}

export function getDatabaseConfig(): DatabaseConfig {
  return {
    host: requireEnv("DB_HOST"),
    port: parsePositiveInt("DB_PORT", 3306),
    database: requireEnv("DB_NAME"),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    // Hostinger shared MySQL biedt standaard geen geldig TLS-certificaat op
    // remote verbindingen. Zet DB_SSL=true zodra dat wel het geval is.
    ssl: parseBooleanEnv("DB_SSL", false),
    // Bewust laag: Hostinger limiteert het aantal gelijktijdige verbindingen
    // per gebruiker en Vercel draait meerdere serverless instanties.
    connectionLimit: parsePositiveInt("DB_CONNECTION_LIMIT", 3),
  };
}
