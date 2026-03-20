import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import { buildCustomerStatusEmail } from "@/lib/email-template";

async function ensureAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return adminRow ? user : null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await ensureAdmin();

  if (!user) {
    return NextResponse.json({ error: "Niet geautoriseerd." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = (await request.json()) as {
      status?: "confirmed" | "rejected";
      adminNote?: string;
    };

    if (body.status !== "confirmed" && body.status !== "rejected") {
      return NextResponse.json({ error: "Ongeldige status." }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: reservation, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", Number(id))
      .single();

    if (error || !reservation) {
      return NextResponse.json(
        { error: "Reservering niet gevonden." },
        { status: 404 }
      );
    }

    const nowIso = new Date().toISOString();

    const payload =
      body.status === "confirmed"
        ? {
            status: "confirmed",
            admin_note: body.adminNote || null,
            confirmed_at: nowIso,
            updated_at: nowIso,
          }
        : {
            status: "rejected",
            admin_note: body.adminNote || null,
            rejected_at: nowIso,
            updated_at: nowIso,
          };

    const { error: updateError } = await supabase
      .from("reservations")
      .update(payload)
      .eq("id", reservation.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail =
      process.env.RESERVATION_FROM_EMAIL ||
      "Taxi De Polder <reserveringen@notify.taxidepolder.nl>";
    const replyTo =
      process.env.RESERVATION_REPLY_TO || "m.hammid2004@gmail.com";

    if (resendApiKey) {
      const resend = new Resend(resendApiKey);

      await resend.emails.send({
        from: fromEmail,
        to: [reservation.email],
        replyTo,
        subject:
          body.status === "confirmed"
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
          status: body.status,
          adminNote: body.adminNote || "",
        }),
      });

      await supabase
        .from("reservations")
        .update({
          status_email_sent_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", reservation.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Status wijzigen mislukt.",
      },
      { status: 500 }
    );
  }
}
