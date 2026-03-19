export type RouteQuoteResult = {
  distanceMeters: number;
  durationSeconds: number;
  distanceKm: number;
  durationText: string;
};

function parseGoogleDuration(duration: string): number {
  // Google geeft meestal waarden terug zoals "1532s"
  if (!duration.endsWith("s")) return 0;
  return Number(duration.replace("s", ""));
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
}) : Promise<RouteQuoteResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY ontbreekt");
  }

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
    const errorText = await response.text();
    throw new Error(`Google Routes API fout: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  if (!data.routes || !Array.isArray(data.routes) || data.routes.length === 0) {
    throw new Error("Geen route gevonden");
  }

  const route = data.routes[0];
  const distanceMeters = Number(route.distanceMeters ?? 0);
  const durationSeconds = parseGoogleDuration(route.duration ?? "0s");

  return {
    distanceMeters,
    durationSeconds,
    distanceKm: Number((distanceMeters / 1000).toFixed(1)),
    durationText: formatDuration(durationSeconds),
  };
}