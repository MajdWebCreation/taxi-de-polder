type ReservationEmailParams = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  pickup: string;
  destination: string;
  pickupDate: string;
  pickupHour: string;
  pickupMinute: string;
  passengers: string;
  vehicle: string;
  notes: string;
  distanceKm: number;
  durationText: string;
  totalPrice: number;
  pricingMode: "special" | "dynamic";
};

export function buildReservationEmailHtml(params: ReservationEmailParams) {
  const fullName = `${params.firstName} ${params.lastName}`.trim();
  const pickupMoment = `${params.pickupDate} om ${params.pickupHour}:${params.pickupMinute}`;
  const tariffLabel =
    params.pricingMode === "special" ? "Vast tarief" : "Standaard berekening";

  return `
<!DOCTYPE html>
<html lang="nl">
  <head>
    <meta charSet="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Nieuwe reserveringsaanvraag</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#0f1720;">
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="background:#f3f4f6;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="max-width:720px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="background:#0b5a4e;padding:32px 32px 24px 32px;">
                <div style="font-size:13px;letter-spacing:0.18em;text-transform:uppercase;font-weight:700;color:#f4c542;">
                  Taxi De Polder
                </div>
                <h1 style="margin:14px 0 8px 0;font-size:32px;line-height:1.2;color:#ffffff;">
                  Nieuwe reserveringsaanvraag
                </h1>
                <p style="margin:0;color:rgba(255,255,255,0.82);font-size:16px;line-height:1.7;">
                  Er is zojuist een nieuwe reservering binnengekomen via de website.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:28px 32px;">
                <table role="presentation" width="100%" cellPadding="0" cellSpacing="0">
                  <tr>
                    <td style="padding:0 0 24px 0;">
                      <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;color:#0b5a4e;">
                        Overzicht
                      </div>
                      <div style="margin-top:12px;padding:20px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;">
                        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0">
                          <tr>
                            <td style="padding:0 0 12px 0;font-size:14px;color:#64748b;">Naam</td>
                            <td style="padding:0 0 12px 0;font-size:15px;font-weight:700;color:#0f1720;text-align:right;">${escapeHtml(fullName)}</td>
                          </tr>
                          <tr>
                            <td style="padding:0 0 12px 0;font-size:14px;color:#64748b;">E-mail</td>
                            <td style="padding:0 0 12px 0;font-size:15px;font-weight:700;color:#0f1720;text-align:right;">${escapeHtml(params.email)}</td>
                          </tr>
                          <tr>
                            <td style="padding:0 0 12px 0;font-size:14px;color:#64748b;">Telefoon</td>
                            <td style="padding:0 0 12px 0;font-size:15px;font-weight:700;color:#0f1720;text-align:right;">${escapeHtml(params.phone)}</td>
                          </tr>
                          <tr>
                            <td style="padding:0 0 12px 0;font-size:14px;color:#64748b;">Ophaalmoment</td>
                            <td style="padding:0 0 12px 0;font-size:15px;font-weight:700;color:#0f1720;text-align:right;">${escapeHtml(pickupMoment)}</td>
                          </tr>
                          <tr>
                            <td style="padding:0 0 12px 0;font-size:14px;color:#64748b;">Passagiers</td>
                            <td style="padding:0 0 12px 0;font-size:15px;font-weight:700;color:#0f1720;text-align:right;">${escapeHtml(params.passengers)}</td>
                          </tr>
                          <tr>
                            <td style="padding:0 0 12px 0;font-size:14px;color:#64748b;">Voertuig</td>
                            <td style="padding:0 0 12px 0;font-size:15px;font-weight:700;color:#0f1720;text-align:right;">${escapeHtml(params.vehicle)}</td>
                          </tr>
                          <tr>
                            <td style="padding:0;font-size:14px;color:#64748b;">Tarief</td>
                            <td style="padding:0;font-size:15px;font-weight:700;color:#0f1720;text-align:right;">${escapeHtml(tariffLabel)}</td>
                          </tr>
                        </table>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:0 0 24px 0;">
                      <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;color:#0b5a4e;">
                        Ritgegevens
                      </div>
                      <div style="margin-top:12px;padding:20px;border-radius:18px;background:#ffffff;border:1px solid #e5e7eb;">
                        <p style="margin:0 0 8px 0;font-size:13px;font-weight:700;color:#64748b;">Vertrekadres</p>
                        <p style="margin:0 0 18px 0;font-size:16px;line-height:1.7;color:#0f1720;">${escapeHtml(params.pickup)}</p>

                        <p style="margin:0 0 8px 0;font-size:13px;font-weight:700;color:#64748b;">Aankomstadres</p>
                        <p style="margin:0;font-size:16px;line-height:1.7;color:#0f1720;">${escapeHtml(params.destination)}</p>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:0 0 24px 0;">
                      <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;color:#0b5a4e;">
                        Berekening
                      </div>
                      <div style="margin-top:12px;padding:20px;border-radius:18px;background:#0b5a4e;">
                        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0">
                          <tr>
                            <td style="padding:0 0 12px 0;font-size:14px;color:rgba(255,255,255,0.72);">Afstand</td>
                            <td style="padding:0 0 12px 0;font-size:16px;font-weight:700;color:#ffffff;text-align:right;">${params.distanceKm} km</td>
                          </tr>
                          <tr>
                            <td style="padding:0 0 12px 0;font-size:14px;color:rgba(255,255,255,0.72);">Geschatte reistijd</td>
                            <td style="padding:0 0 12px 0;font-size:16px;font-weight:700;color:#ffffff;text-align:right;">${escapeHtml(params.durationText)}</td>
                          </tr>
                          <tr>
                            <td style="padding:0;font-size:14px;color:rgba(255,255,255,0.72);">Prijs</td>
                            <td style="padding:0;font-size:24px;font-weight:800;color:#f4c542;text-align:right;">€ ${params.totalPrice.toFixed(2)}</td>
                          </tr>
                        </table>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:0;">
                      <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;color:#0b5a4e;">
                        Opmerking
                      </div>
                      <div style="margin-top:12px;padding:20px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;">
                        <p style="margin:0;font-size:15px;line-height:1.8;color:#334155;">
                          ${escapeHtml(params.notes || "-")}
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 32px 32px 32px;background:#fafafa;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:13px;line-height:1.7;color:#64748b;">
                  Deze e-mail is automatisch verzonden vanaf de website van Taxi De Polder.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}