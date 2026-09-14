/**
 * Conversies tussen MySQL-kolomwaarden en de vormen die de applicatie al
 * gebruikte toen de database nog PostgreSQL was.
 */

/** DATETIME(3) -> ISO 8601 string in UTC, gelijk aan het oude `timestamptz`. */
export function toIsoString(value: unknown): string {
  const iso = toNullableIsoString(value);

  if (iso === null) {
    throw new Error("Expected a non-null timestamp value");
  }

  return iso;
}

export function toNullableIsoString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    // Valt alleen voor als de driver dateStrings zou teruggeven.
    const parsed = new Date(value.replace(" ", "T") + "Z");

    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Cannot parse timestamp value: ${value}`);
    }

    return parsed.toISOString();
  }

  throw new Error(`Cannot parse timestamp value of type ${typeof value}`);
}

/** ISO 8601 string -> Date, die mysql2 met `timezone: "Z"` als UTC wegschrijft. */
export function toMysqlDateTime(value: string): Date {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Cannot convert value to a MySQL DATETIME: ${value}`);
  }

  return parsed;
}

export function toNullableMysqlDateTime(value: string | null): Date | null {
  return value === null ? null : toMysqlDateTime(value);
}

/** TINYINT(1) -> boolean. MySQL kent geen echt boolean-type. */
export function toBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}
