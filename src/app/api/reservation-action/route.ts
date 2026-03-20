import { NextRequest, NextResponse } from "next/server";
import { getReservationEmailConfig } from "@/features/email/config";
import { sendCustomerReservationStatusEmail } from "@/features/email/reservation-mailer";
import {
  mapReservationToEmailData,
  markStatusEmailSent,
  updateReservationStatusByActionToken,
} from "@/features/reservations/service";

export async function GET(request: NextRequest) {
  const { appUrl, resendApiKey } = getReservationEmailConfig();

  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    const decision = url.searchParams.get("decision");

    if (!token || (decision !== "confirm" && decision !== "reject")) {
      return NextResponse.redirect(`${appUrl}/admin/reservations?error=invalid_action`);
    }

    const result = await updateReservationStatusByActionToken({
      token,
      decision,
    });

    if (!result) {
      return NextResponse.redirect(`${appUrl}/admin/reservations?error=not_found`);
    }

    if (resendApiKey) {
      await sendCustomerReservationStatusEmail({
        reservation: mapReservationToEmailData(result.reservation),
        status: result.status,
        adminNote: result.adminNote,
      });
      await markStatusEmailSent(result.reservation.id, result.nowIso);
    }

    return NextResponse.redirect(
      `${appUrl}/admin/reservations?updated=${result.status}`
    );
  } catch {
    return NextResponse.redirect(`${appUrl}/admin/reservations?error=action_failed`);
  }
}
