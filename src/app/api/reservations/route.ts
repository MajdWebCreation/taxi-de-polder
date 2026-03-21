import { NextRequest, NextResponse } from "next/server";
import {
  sendAdminReservationEmail,
  sendCustomerPendingReservationEmail,
} from "@/features/email/reservation-mailer";
import { getReservationEmailConfig } from "@/features/email/config";
import {
  createReservation,
  markCustomerPendingEmailSent,
} from "@/features/reservations/service";
import type { ReservationRequestBody } from "@/types/reservations";

export async function POST(request: NextRequest) {
  try {
    const { resendApiKey } = getReservationEmailConfig();

    if (!resendApiKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY ontbreekt." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as ReservationRequestBody;

    const requiredFields: Array<keyof ReservationRequestBody> = [
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

    const fieldLabels: Record<keyof ReservationRequestBody, string> = {
      pickup: "Vertrekadres",
      destination: "Aankomstadres",
      pickupDate: "Datum",
      pickupHour: "Uur",
      pickupMinute: "Minuten",
      passengers: "Aantal passagiers",
      vehicle: "Voertuig",
      firstName: "Voornaam",
      lastName: "Achternaam",
      email: "E-mailadres",
      phone: "Telefoonnummer",
      notes: "Extra opmerkingen",
    };

    for (const field of requiredFields) {
      if (!String(body[field] ?? "").trim()) {
        return NextResponse.json(
          { error: `${fieldLabels[field]} is verplicht.` },
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

    const { reservation, reservationEmailData, actionToken } =
      await createReservation(body);

    await sendAdminReservationEmail({
      reservation: reservationEmailData,
      actionToken,
    });

    await sendCustomerPendingReservationEmail(reservationEmailData);
    await markCustomerPendingEmailSent(
      reservation.id,
      new Date().toISOString()
    );

    return NextResponse.json({
      success: true,
      reservationId: reservation.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Onbekende fout bij reservering";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
