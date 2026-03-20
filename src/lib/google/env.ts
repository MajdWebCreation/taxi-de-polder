export class GoogleServerConfigError extends Error {
  readonly status = 500;

  constructor(message: string) {
    super(message);
    this.name = "GoogleServerConfigError";
  }
}

export class GoogleApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "GoogleApiError";
    this.status = status;
  }
}

// Alleen gebruiken in server-side routes en helpers voor Google API-calls.
export function getGoogleMapsServerApiKey(): string {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY?.trim();

  if (!apiKey) {
    throw new GoogleServerConfigError(
      "Serverconfiguratie ontbreekt: GOOGLE_MAPS_SERVER_API_KEY is niet ingesteld."
    );
  }

  return apiKey;
}

export async function getGoogleApiErrorMessage(
  response: Response,
  serviceName: string
): Promise<string> {
  const rawText = await response.text();
  const fallback = `${serviceName} fout (${response.status}).`;

  if (!rawText) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(rawText) as {
      error?: {
        message?: string;
        status?: string;
      };
    };

    const message = parsed.error?.message?.trim();
    const statusText = parsed.error?.status?.trim();

    if (message && statusText) {
      return `${serviceName} fout (${response.status} ${statusText}): ${message}`;
    }

    if (message) {
      return `${serviceName} fout (${response.status}): ${message}`;
    }
  } catch {
    // Val terug op de ruwe response tekst als de body geen JSON is.
  }

  return `${serviceName} fout (${response.status}): ${rawText}`;
}

export function getErrorStatus(error: unknown): number {
  if (
    error instanceof GoogleApiError ||
    error instanceof GoogleServerConfigError
  ) {
    return error.status;
  }

  return 500;
}

export function getErrorMessage(
  error: unknown,
  fallbackMessage: string
): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}
