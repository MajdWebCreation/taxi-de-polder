import { Resend } from "resend";
import type {
  ReservationActionStatus,
  ReservationEmailData,
} from "@/types/reservations";
import { getReservationEmailConfig } from "@/features/email/config";
import {
  buildAdminReservationEmail,
  buildCustomerPendingEmail,
  buildCustomerStatusEmail,
} from "@/features/email/templates";

function createResendClient() {
  const config = getReservationEmailConfig();

  if (!config.resendApiKey) {
    throw new Error("RESEND_API_KEY ontbreekt.");
  }

  return {
    resend: new Resend(config.resendApiKey),
    config,
  };
}

export async function sendAdminReservationEmail(params: {
  reservation: ReservationEmailData;
  actionToken: string;
}) {
  const { resend, config } = createResendClient();
  const result = await resend.emails.send({
    from: config.fromEmail,
    to: [config.toEmail],
    replyTo: config.replyTo,
    subject: `Nieuwe reservering #${params.reservation.id} - ${params.reservation.customerName}`,
    html: buildAdminReservationEmail({
      reservation: params.reservation,
      appUrl: config.appUrl,
      actionToken: params.actionToken,
    }),
  });

  if (result.error) {
    throw new Error(result.error.message || "Admin e-mail verzenden mislukt.");
  }
}

export async function sendCustomerPendingReservationEmail(
  reservation: ReservationEmailData
) {
  const { resend, config } = createResendClient();
  const result = await resend.emails.send({
    from: config.fromEmail,
    to: [reservation.customerEmail],
    replyTo: config.replyTo,
    subject: `Uw reservering #${reservation.id} is ontvangen`,
    html: buildCustomerPendingEmail(reservation),
  });

  if (result.error) {
    throw new Error(
      result.error.message || "Klantbevestiging verzenden mislukt."
    );
  }
}

export async function sendCustomerReservationStatusEmail(params: {
  reservation: ReservationEmailData;
  status: ReservationActionStatus;
  adminNote?: string | null;
}) {
  const { resend, config } = createResendClient();
  const result = await resend.emails.send({
    from: config.fromEmail,
    to: [params.reservation.customerEmail],
    replyTo: config.replyTo,
    subject:
      params.status === "confirmed"
        ? `Uw reservering #${params.reservation.id} is bevestigd`
        : `Uw reservering #${params.reservation.id} is afgewezen`,
    html: buildCustomerStatusEmail({
      reservation: params.reservation,
      status: params.status,
      adminNote: params.adminNote,
    }),
  });

  if (result.error) {
    throw new Error(
      result.error.message || "Statusmail naar klant verzenden mislukt."
    );
  }
}
