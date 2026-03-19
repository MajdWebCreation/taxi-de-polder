import { NextRequest, NextResponse } from "next/server";

type Suggestion = {
  placeId: string;
  text: string;
  secondaryText?: string;
};

type GoogleAutocompleteResponse = {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string;
      text?: {
        text?: string;
      };
      structuredFormat?: {
        secondaryText?: {
          text?: string;
        };
      };
    };
  }>;
};

type MappedSuggestion = Suggestion | null;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GOOGLE_MAPS_API_KEY ontbreekt." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const input = String(body.input ?? "").trim();
    const sessionToken = String(body.sessionToken ?? "").trim();

    if (input.length < 3) {
      return NextResponse.json({ suggestions: [] });
    }

    const response = await fetch(
      "https://places.googleapis.com/v1/places:autocomplete",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
        },
        body: JSON.stringify({
          input,
          sessionToken,
          includedRegionCodes: ["nl"],
          languageCode: "nl",
        }),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Google Places fout: ${response.status} ${errorText}` },
        { status: 500 }
      );
    }

    const data: GoogleAutocompleteResponse = await response.json();

    const mappedSuggestions: MappedSuggestion[] = (data.suggestions ?? []).map(
      (item) => {
        const prediction = item.placePrediction;
        if (!prediction) return null;

        const suggestion: Suggestion = {
          placeId: prediction.placeId ?? "",
          text: prediction.text?.text ?? "",
        };

        const secondaryText = prediction.structuredFormat?.secondaryText?.text;

        if (secondaryText) {
          suggestion.secondaryText = secondaryText;
        }

        return suggestion;
      }
    );

    const suggestions: Suggestion[] = mappedSuggestions.filter(
      (item): item is Suggestion => item !== null
    );

    return NextResponse.json({ suggestions });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Onbekende fout bij autocomplete";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}