import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdminUser } from "@/features/auth/require-admin";
import { getReservationEmailConfig } from "@/features/email/config";
import { sendCustomerReservationStatusEmail } from "@/features/email/reservation-mailer";
import {
  mapReservationToEmailData,
  markStatusEmailSent,
  updateReservationStatusById,
} from "@/features/reservations/service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAuthenticatedAdminUser();

  if (!admin) {
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

    const result = await updateReservationStatusById({
      id: Number(id),
      status: body.status,
      adminNote: body.adminNote,
    });

    if (!result) {
      return NextResponse.json(
        { error: "Reservering niet gevonden." },
        { status: 404 }
      );
    }

    const { resendApiKey } = getReservationEmailConfig();

    if (resendApiKey) {
      await sendCustomerReservationStatusEmail({
        reservation: mapReservationToEmailData(result.reservation),
        status: result.status,
        adminNote: result.adminNote,
      });
      await markStatusEmailSent(result.reservation.id, result.nowIso);
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
