import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildCustomerStatusEmail } from "@/lib/email-template";

export async function GET(request: NextRequest) {
  const appUrl = process.env.APP_URL || "https://www.taxidepolder.nl";
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.RESERVATION_FROM_EMAIL ||
    "Taxi De Polder <reserveringen@notify.taxidepolder.nl>";
  const replyTo =
    process.env.RESERVATION_REPLY_TO || "m.hammid2004@gmail.com";

  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    const decision = url.searchParams.get("decision");

    if (!token || (decision !== "confirm" && decision !== "reject")) {
      return NextResponse.redirect(`${appUrl}/admin/reservations?error=invalid_action`);
    }

    const supabase = createAdminClient();

    const { data: reservation, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("action_token", token)
      .single();

    if (error || !reservation) {
      return NextResponse.redirect(`${appUrl}/admin/reservations?error=not_found`);
    }

    const nextStatus = decision === "confirm" ? "confirmed" : "rejected";
    const nowIso = new Date().toISOString();

    const updatePayload =
      nextStatus === "confirmed"
        ? { status: nextStatus, confirmed_at: nowIso, updated_at: nowIso }
        : { status: nextStatus, rejected_at: nowIso, updated_at: nowIso };

    await supabase.from("reservations").update(updatePayload).eq("id", reservation.id);

    if (resendApiKey) {
      const resend = new Resend(resendApiKey);

      await resend.emails.send({
        from: fromEmail,
        to: [reservation.email],
        replyTo,
        subject:
          nextStatus === "confirmed"
            ? `Uw reservering #${reservation.id} is bevestigd`
            : `Uw reservering #${reservation.id} is afgewezen`,
        html: buildCustomerStatusEmail({
          reservation: {
            id: reservation.id,
            customerName: `${reservation.first_name} ${reservation.last_name}`.trim(),
            customerEmail: reservation.email,
            customerPhone: reservation.phone,
            pickup: reservation.pickup,
            destination: reservation.destination,
            pickupDate: String(reservation.pickup_date),
            pickupTime: reservation.pickup_time,
            passengers: String(reservation.passengers),
            vehicle: reservation.vehicle_type,
            notes: reservation.notes || "",
            distanceKm: Number(reservation.distance_km),
            durationText: reservation.duration_text,
            priceTotal: Number(reservation.price_total),
            pricingMode: reservation.pricing_mode,
          },
          status: nextStatus,
          adminNote: reservation.admin_note,
        }),
      });

      await supabase
        .from("reservations")
        .update({
          status_email_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", reservation.id);
    }

    return NextResponse.redirect(
      `${appUrl}/admin/reservations?updated=${nextStatus}`
    );
  } catch {
    return NextResponse.redirect(`${appUrl}/admin/reservations?error=action_failed`);
  }
}
