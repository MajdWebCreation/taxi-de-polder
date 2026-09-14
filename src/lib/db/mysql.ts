import "server-only";
import mysql from "mysql2/promise";
import { getDatabaseConfig } from "@/lib/db/env";

type GlobalWithPool = typeof globalThis & {
  __taxiDePolderMysqlPool?: mysql.Pool;
};

const globalWithPool = globalThis as GlobalWithPool;

function createPool(): mysql.Pool {
  const config = getDatabaseConfig();

  return mysql.createPool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    // Echte TLS-validatie: mysql2 controleert standaard wel de
    // certificaatketen (rejectUnauthorized), maar niet of de hostnaam bij het
    // certificaat hoort. verifyIdentity zet die controle aan. De keten wordt
    // geverifieerd tegen de CA-store van Node; geen eigen CA-bestand nodig.
    ssl: config.ssl
      ? {
          minVersion: "TLSv1.2",
          rejectUnauthorized: true,
          verifyIdentity: true,
        }
      : undefined,
    waitForConnections: true,
    connectionLimit: config.connectionLimit,
    maxIdle: config.connectionLimit,
    // Ruim verbindingen op voordat Hostinger of Vercel dat doet, zodat een
    // koude serverless instantie nooit een dode socket hergebruikt.
    idleTimeout: 30_000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,
    connectTimeout: 10_000,
    // Alle DATETIME-waarden worden als UTC gelezen en geschreven, gelijk aan
    // het `timestamptz`-gedrag van de vorige PostgreSQL-database.
    timezone: "Z",
    // DATE (pickup_date) blijft een "YYYY-MM-DD" string, net als voorheen.
    // DATETIME komt terug als Date en wordt in de repositories naar ISO
    // omgezet.
    dateStrings: ["DATE"],
    supportBigNumbers: true,
    bigNumberStrings: false,
    namedPlaceholders: false,
  });
}

/**
 * Eén pool per Node-proces. Op Vercel wordt een warme lambda hergebruikt,
 * dus de pool blijft bestaan tussen requests en opent geen nieuwe
 * verbindingen per aanroep.
 */
export function getPool(): mysql.Pool {
  if (!globalWithPool.__taxiDePolderMysqlPool) {
    globalWithPool.__taxiDePolderMysqlPool = createPool();
  }

  return globalWithPool.__taxiDePolderMysqlPool;
}

export async function query<Row>(
  sql: string,
  params: ReadonlyArray<unknown> = []
): Promise<Row[]> {
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    sql,
    params as unknown[]
  );

  return rows as Row[];
}

export async function queryOne<Row>(
  sql: string,
  params: ReadonlyArray<unknown> = []
): Promise<Row | null> {
  const rows = await query<Row>(sql, params);

  return rows[0] ?? null;
}

export async function execute(
  sql: string,
  params: ReadonlyArray<unknown> = []
): Promise<mysql.ResultSetHeader> {
  const [result] = await getPool().query<mysql.ResultSetHeader>(
    sql,
    params as unknown[]
  );

  return result;
}

export async function withTransaction<Result>(
  handler: (connection: mysql.PoolConnection) => Promise<Result>
): Promise<Result> {
  const connection = await getPool().getConnection();

  try {
    await connection.beginTransaction();
    const result = await handler(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
