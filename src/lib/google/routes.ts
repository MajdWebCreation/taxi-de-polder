import {
  getGoogleApiErrorMessage,
  getGoogleMapsServerApiKey,
  GoogleApiError,
} from "@/lib/google/env";

export type RouteQuoteResult = {
  distanceMeters: number;
  durationSeconds: number;
  distanceKm: number;
  durationMinutes: number;
  durationText: string;
};

function parseGoogleDuration(duration: string): number {
  // Google geeft meestal waarden terug zoals "1532s"
  if (!duration.endsWith("s")) return 0;
  return Number(duration.replace("s", ""));
}

function getDurationMinutes(durationSeconds: number): number {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new GoogleApiError(
      "Google Routes API gaf geen geldige geschatte reistijd terug voor deze rit.",
      502
    );
  }

  return Number((durationSeconds / 60).toFixed(2));
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.ceil((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}u ${minutes}m`;
  }

  return `${minutes} min`;
}

export async function getRouteQuoteFromGoogle(params: {
  origin: string;
  destination: string;
}): Promise<RouteQuoteResult> {
  const apiKey = getGoogleMapsServerApiKey();

  const response = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
      },
      body: JSON.stringify({
        origin: {
          address: params.origin,
        },
        destination: {
          address: params.destination,
        },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        languageCode: "nl-NL",
        regionCode: "NL",
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new GoogleApiError(
      await getGoogleApiErrorMessage(response, "Google Routes API"),
      response.status
    );
  }

  const data = (await response.json()) as {
    routes?: Array<{
      distanceMeters?: number | string;
      duration?: string;
    }>;
  };

  if (!data.routes || !Array.isArray(data.routes) || data.routes.length === 0) {
    throw new GoogleApiError(
      "Google Routes API gaf geen route terug voor deze rit.",
      502
    );
  }

  const route = data.routes[0];
  const distanceMeters = Number(route.distanceMeters ?? 0);
  const durationSeconds = parseGoogleDuration(route.duration ?? "0s");
  const durationMinutes = getDurationMinutes(durationSeconds);

  if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) {
    throw new GoogleApiError(
      "Google Routes API gaf geen geldige afstand terug voor deze rit.",
      502
    );
  }

  return {
    distanceMeters,
    durationSeconds,
    distanceKm: Number((distanceMeters / 1000).toFixed(1)),
    durationMinutes,
    durationText: formatDuration(durationSeconds),
  };
}
