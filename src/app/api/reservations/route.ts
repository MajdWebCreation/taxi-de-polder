import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getRouteQuoteFromGoogle } from "@/lib/google-routes";
import { getComputedPrice } from "@/lib/pricing-store";
import { createAdminClient } from "@/lib/supabase/admin";
import type { VehicleType } from "@/lib/pricing";
import {
  buildAdminReservationEmail,
  buildCustomerPendingEmail,
} from "@/lib/email-template";

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
      "Taxi De Polder <reserveringen@notify.taxidepolder.nl>";
    const replyTo =
      process.env.RESERVATION_REPLY_TO || "m.hammid2004@gmail.com";
    const appUrl = process.env.APP_URL || "https://www.taxidepolder.nl";

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

    const priceTotal = Number(pricing.total);
    const pickupTime = `${body.pickupHour}:${body.pickupMinute}`;
    const supabase = createAdminClient();
    const actionToken = crypto.randomUUID();

    const { data: reservationRow, error: insertError } = await supabase
      .from("reservations")
      .insert({
        status: "pending",
        first_name: body.firstName,
        last_name: body.lastName,
        email: body.email,
        phone: body.phone,
        pickup: body.pickup,
        destination: body.destination,
        pickup_date: body.pickupDate,
        pickup_time: pickupTime,
        passengers: Number(body.passengers),
        vehicle_type: body.vehicle,
        notes: body.notes || null,
        distance_km: route.distanceKm,
        duration_text: route.durationText,
        price_total: priceTotal,
        pricing_mode: pricing.mode,
        action_token: actionToken,
      })
      .select("id")
      .single();

    if (insertError || !reservationRow?.id) {
      return NextResponse.json(
        { error: insertError?.message || "Reservering opslaan mislukt." },
        { status: 500 }
      );
    }

    const reservation = {
      id: reservationRow.id,
      customerName: `${body.firstName} ${body.lastName}`.trim(),
      customerEmail: body.email,
      customerPhone: body.phone,
      pickup: body.pickup,
      destination: body.destination,
      pickupDate: body.pickupDate,
      pickupTime,
      passengers: body.passengers,
      vehicle: body.vehicle,
      notes: body.notes || "",
      distanceKm: route.distanceKm,
      durationText: route.durationText,
      priceTotal,
      pricingMode: pricing.mode,
    };

    const resend = new Resend(resendApiKey);

    const adminEmail = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      replyTo: replyTo,
      subject: `Nieuwe reservering #${reservation.id} - ${reservation.customerName}`,
      html: buildAdminReservationEmail({
        reservation,
        appUrl,
        actionToken,
      }),
    });

    if (adminEmail.error) {
      return NextResponse.json(
        { error: adminEmail.error.message || "Admin e-mail verzenden mislukt." },
        { status: 500 }
      );
    }

    const customerEmail = await resend.emails.send({
      from: fromEmail,
      to: [body.email],
      replyTo: replyTo,
      subject: `Uw reservering #${reservation.id} is ontvangen`,
      html: buildCustomerPendingEmail(reservation),
    });

    if (customerEmail.error) {
      return NextResponse.json(
        {
          error:
            customerEmail.error.message ||
            "Klantbevestiging verzenden mislukt.",
        },
        { status: 500 }
      );
    }

    await supabase
      .from("reservations")
      .update({
        customer_email_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", reservation.id);

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
