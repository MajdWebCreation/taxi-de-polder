import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getRouteQuoteFromGoogle } from "@/lib/google-routes";
import { calculatePrice, type VehicleType } from "@/lib/pricing";

type ReservationBody = {
  pickup: string;
  destination: string;
  pickupDate: string;
  pickupHour: string;
  pickupMinute: string;
  passengers: string;
  vehicle: VehicleType;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes: string;
};

export async function POST(request: NextRequest) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const toEmail =
      process.env.RESERVATION_TO_EMAIL || "m.hammid2004@gmail.com";
    const fromEmail =
      process.env.RESERVATION_FROM_EMAIL ||
      "Taxi De Polder <onboarding@resend.dev>";

    if (!resendApiKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY ontbreekt." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as ReservationBody;

    const requiredFields: Array<keyof ReservationBody> = [
      "pickup",
      "destination",
      "pickupDate",
      "pickupHour",
      "pickupMinute",
      "passengers",
      "vehicle",
      "firstName",
      "lastName",
      "email",
      "phone",
    ];

    for (const field of requiredFields) {
      if (!String(body[field] ?? "").trim()) {
        return NextResponse.json(
          { error: `Veld ontbreekt: ${field}` },
          { status: 400 }
        );
      }
    }

    if (body.vehicle !== "auto" && body.vehicle !== "busje") {
      return NextResponse.json(
        { error: "Ongeldig voertuig." },
        { status: 400 }
      );
    }

    const route = await getRouteQuoteFromGoogle({
      origin: body.pickup,
      destination: body.destination,
    });

    const pricing = calculatePrice({
      distanceKm: route.distanceKm,
      vehicle: body.vehicle,
      pickup: body.pickup,
      destination: body.destination,
      pickupHour: Number(body.pickupHour),
    });

    const resend = new Resend(resendApiKey);

    const html = `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h1 style="margin-bottom: 8px;">Nieuwe reserveringsaanvraag</h1>
        <p style="margin-top: 0;">Taxi De Polder</p>

        <h2>Ritgegevens</h2>
        <ul>
          <li><strong>Vertrekadres:</strong> ${escapeHtml(body.pickup)}</li>
          <li><strong>Aankomstadres:</strong> ${escapeHtml(body.destination)}</li>
          <li><strong>Datum:</strong> ${escapeHtml(body.pickupDate)}</li>
          <li><strong>Tijd:</strong> ${escapeHtml(body.pickupHour)}:${escapeHtml(body.pickupMinute)}</li>
          <li><strong>Passagiers:</strong> ${escapeHtml(body.passengers)}</li>
          <li><strong>Voertuig:</strong> ${escapeHtml(body.vehicle)}</li>
        </ul>

        <h2>Berekening</h2>
        <ul>
          <li><strong>Afstand:</strong> ${route.distanceKm} km</li>
          <li><strong>Geschatte reistijd:</strong> ${route.durationText}</li>
          <li><strong>Prijs:</strong> € ${pricing.total.toFixed(2)}</li>
        </ul>

        <h2>Klantgegevens</h2>
        <ul>
          <li><strong>Naam:</strong> ${escapeHtml(body.firstName)} ${escapeHtml(body.lastName)}</li>
          <li><strong>E-mail:</strong> ${escapeHtml(body.email)}</li>
          <li><strong>Telefoon:</strong> ${escapeHtml(body.phone)}</li>
          <li><strong>Opmerking:</strong> ${escapeHtml(body.notes || "-")}</li>
        </ul>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      replyTo: body.email,
      subject: `Nieuwe reservering - ${body.firstName} ${body.lastName}`,
      html,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "E-mail verzenden mislukt." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      emailId: data?.id,
      route,
      pricing,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Onbekende fout bij reservering";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}