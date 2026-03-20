import { NextRequest, NextResponse } from "next/server";
import {
  getErrorMessage,
  getErrorStatus,
  getGoogleApiErrorMessage,
  getGoogleMapsServerApiKey,
  GoogleApiError,
} from "@/lib/google-env";

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
    const apiKey = getGoogleMapsServerApiKey();

    const body = (await request.json()) as {
      input?: unknown;
      sessionToken?: unknown;
    };
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
      throw new GoogleApiError(
        await getGoogleApiErrorMessage(response, "Google Places API"),
        response.status
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
    const message = getErrorMessage(
      error,
      "Onbekende fout bij adresaanvulling."
    );
    const status = getErrorStatus(error);

    return NextResponse.json({ error: message }, { status });
  }
}
