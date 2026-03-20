import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getRouteQuoteFromGoogle } from "@/lib/google-routes";
import { getComputedPrice } from "@/lib/pricing-store";
import type { VehicleType } from "@/lib/pricing";
import { buildReservationEmailHtml } from "@/lib/email-template";

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
      process.env.RESERVATION_TO_EMAIL || "info@taxidepolder.nl";
    const fromEmail =
      process.env.RESERVATION_FROM_EMAIL ||
      "Taxi De Polder <info@taxidepolder.nl>";

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

    const pricing = await getComputedPrice({
      pickup: body.pickup,
      destination: body.destination,
      vehicle: body.vehicle,
      pickupHour: Number(body.pickupHour),
      distanceKm: route.distanceKm,
    });

    const totalPrice = pricing.total;

    const resend = new Resend(resendApiKey);

    const html = buildReservationEmailHtml({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      pickup: body.pickup,
      destination: body.destination,
      pickupDate: body.pickupDate,
      pickupHour: body.pickupHour,
      pickupMinute: body.pickupMinute,
      passengers: body.passengers,
      vehicle: body.vehicle,
      notes: body.notes,
      distanceKm: route.distanceKm,
      durationText: route.durationText,
      totalPrice,
      pricingMode: pricing.mode,
    });

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