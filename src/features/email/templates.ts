import type { ReservationEmailData } from "@/types/reservations";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function shell(title: string, intro: string, innerHtml: string) {
  return `
<!DOCTYPE html>
<html lang="nl">
  <head>
    <meta charSet="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#0f1720;">
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="background:#f3f4f6;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="max-width:720px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="background:#0b5a4e;padding:32px;">
                <div style="font-size:13px;letter-spacing:0.18em;text-transform:uppercase;font-weight:700;color:#f4c542;">Taxi De Polder</div>
                <h1 style="margin:14px 0 8px 0;font-size:32px;line-height:1.2;color:#ffffff;">${escapeHtml(
                  title
                )}</h1>
                <p style="margin:0;color:rgba(255,255,255,0.82);font-size:16px;line-height:1.7;">${escapeHtml(
                  intro
                )}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;">${innerHtml}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
}

function reservationSummary(data: ReservationEmailData) {
  return `
    <div style="padding:20px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;">
      <table role="presentation" width="100%" cellPadding="0" cellSpacing="0">
        <tr><td style="padding:0 0 10px 0;color:#64748b;">Reserveringsnummer</td><td style="padding:0 0 10px 0;text-align:right;font-weight:700;">#${data.id}</td></tr>
        <tr><td style="padding:0 0 10px 0;color:#64748b;">Naam</td><td style="padding:0 0 10px 0;text-align:right;font-weight:700;">${escapeHtml(
          data.customerName
        )}</td></tr>
        <tr><td style="padding:0 0 10px 0;color:#64748b;">E-mail</td><td style="padding:0 0 10px 0;text-align:right;font-weight:700;">${escapeHtml(
          data.customerEmail
        )}</td></tr>
        <tr><td style="padding:0 0 10px 0;color:#64748b;">Telefoon</td><td style="padding:0 0 10px 0;text-align:right;font-weight:700;">${escapeHtml(
          data.customerPhone
        )}</td></tr>
        <tr><td style="padding:0 0 10px 0;color:#64748b;">Ophaalmoment</td><td style="padding:0 0 10px 0;text-align:right;font-weight:700;">${escapeHtml(
          `${data.pickupDate} om ${data.pickupTime}`
        )}</td></tr>
        <tr><td style="padding:0 0 10px 0;color:#64748b;">Passagiers</td><td style="padding:0 0 10px 0;text-align:right;font-weight:700;">${escapeHtml(
          data.passengers
        )}</td></tr>
        <tr><td style="padding:0 0 10px 0;color:#64748b;">Voertuig</td><td style="padding:0 0 10px 0;text-align:right;font-weight:700;">${escapeHtml(
          data.vehicle
        )}</td></tr>
        <tr><td style="padding:0 0 10px 0;color:#64748b;">Afstand</td><td style="padding:0 0 10px 0;text-align:right;font-weight:700;">${data.distanceKm} km</td></tr>
        <tr><td style="padding:0 0 10px 0;color:#64748b;">Geschatte reistijd</td><td style="padding:0 0 10px 0;text-align:right;font-weight:700;">${escapeHtml(
          data.durationText
        )}</td></tr>
        <tr><td style="padding:0;color:#64748b;">Geschatte ritprijs</td><td style="padding:0;text-align:right;font-size:22px;font-weight:800;color:#0b5a4e;">€ ${data.priceTotal.toFixed(
          2
        )}</td></tr>
      </table>
    </div>

    <div style="margin-top:18px;padding:20px;border-radius:18px;background:#ffffff;border:1px solid #e5e7eb;">
      <p style="margin:0 0 8px 0;font-size:13px;font-weight:700;color:#64748b;">Vertrekadres</p>
      <p style="margin:0 0 16px 0;font-size:16px;line-height:1.7;color:#0f1720;">${escapeHtml(
        data.pickup
      )}</p>
      <p style="margin:0 0 8px 0;font-size:13px;font-weight:700;color:#64748b;">Aankomstadres</p>
      <p style="margin:0 0 16px 0;font-size:16px;line-height:1.7;color:#0f1720;">${escapeHtml(
        data.destination
      )}</p>
      <p style="margin:0 0 8px 0;font-size:13px;font-weight:700;color:#64748b;">Opmerking</p>
      <p style="margin:0;font-size:15px;line-height:1.8;color:#334155;">${escapeHtml(
        data.notes || "-"
      )}</p>
    </div>
  `;
}

export function buildAdminReservationEmail(params: {
  reservation: ReservationEmailData;
  appUrl: string;
  actionToken: string;
}) {
  const { reservation, appUrl, actionToken } = params;
  const confirmUrl = `${appUrl}/api/reservation-action?token=${actionToken}&decision=confirm`;
  const rejectUrl = `${appUrl}/api/reservation-action?token=${actionToken}&decision=reject`;
  const adminUrl = `${appUrl}/admin/reservations`;
  const replyUrl = `mailto:${encodeURIComponent(
    reservation.customerEmail
  )}?subject=${encodeURIComponent(`Re: reservering #${reservation.id}`)}`;

  return shell(
    "Nieuwe reservering ontvangen",
    "Er staat een nieuwe reservering klaar in de admin pagina.",
    `
      ${reservationSummary(reservation)}

      <div style="margin-top:24px;">
        <a href="${confirmUrl}" style="display:inline-block;background:#0b5a4e;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px;margin-right:10px;">Bevestigen</a>
        <a href="${rejectUrl}" style="display:inline-block;background:#b91c1c;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px;margin-right:10px;">Weigeren</a>
        <a href="${replyUrl}" style="display:inline-block;background:#f4c542;color:#083b34;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px;">Reageer per e-mail</a>
      </div>

      <div style="margin-top:16px;">
        <a href="${adminUrl}" style="color:#0b5a4e;font-weight:700;text-decoration:none;">Open admin overzicht</a>
      </div>
    `
  );
}

export function buildCustomerPendingEmail(reservation: ReservationEmailData) {
  return shell(
    "Uw reservering is ontvangen",
    "Bedankt voor uw aanvraag. Wij controleren uw reservering en bevestigen deze later per e-mail.",
    `
      ${reservationSummary(reservation)}

      <div style="margin-top:22px;padding:18px;border-radius:18px;background:#fff7d6;border:1px solid #f4c542;">
        <p style="margin:0;font-size:15px;line-height:1.8;color:#5b4a00;">
          Uw reservering staat momenteel op <strong>in behandeling</strong>.
          U ontvangt later een bevestiging of afwijzing per e-mail.
        </p>
      </div>
    `
  );
}

export function buildCustomerStatusEmail(params: {
  reservation: ReservationEmailData;
  status: "confirmed" | "rejected";
  adminNote?: string | null;
}) {
  const title =
    params.status === "confirmed"
      ? "Uw reservering is bevestigd"
      : "Uw reservering is afgewezen";

  const intro =
    params.status === "confirmed"
      ? "Goed nieuws. Uw reservering is bevestigd."
      : "Uw reservering is helaas afgewezen.";

  return shell(
    title,
    intro,
    `
      ${reservationSummary(params.reservation)}

      ${
        params.adminNote
          ? `
            <div style="margin-top:18px;padding:18px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;">
              <p style="margin:0 0 8px 0;font-size:13px;font-weight:700;color:#64748b;">Bericht van Taxi De Polder</p>
              <p style="margin:0;font-size:15px;line-height:1.8;color:#334155;">${escapeHtml(
                params.adminNote
              )}</p>
            </div>
          `
          : ""
      }
    `
  );
}
