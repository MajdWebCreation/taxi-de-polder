import type {
  ReservationActionStatus,
  ReservationEmailData,
} from "@/types/reservations";
import {
  SITE_EMAIL,
  SITE_KVK,
  SITE_NAME,
  SITE_PHONE_DISPLAY,
  SITE_PHONE_RAW,
  SITE_URL,
  SITE_WHATSAPP_URL,
} from "@/lib/site";

/**
 * Huisstijl van de website (zie globals/marketing componenten):
 * donkergroen, goud, crème achtergrond, donkere inkt en gedempt grijs.
 */
const BRAND = {
  green: "#0b5a4e",
  greenDark: "#083b34",
  gold: "#f4c542",
  goldSoft: "#fff7d6",
  cream: "#f6f4ee",
  white: "#ffffff",
  ink: "#0f1720",
  muted: "#475569",
  border: "#e5e7eb",
  divider: "#eef0ea",
  panel: "#f8fafc",
  red: "#b91c1c",
  redSoft: "#fee2e2",
  greenSoft: "#e6f4f1",
} as const;

const FONT = "Arial, Helvetica, 'Segoe UI', sans-serif";
const LOGO_URL = `${SITE_URL}/email/logo-taxi-de-polder.png`;
const CONTAINER_WIDTH = 600;

export type RenderedEmail = {
  html: string;
  text: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatEuro(value: number) {
  return `€ ${value.toFixed(2).replace(".", ",")}`;
}

function vehicleLabel(vehicle: ReservationEmailData["vehicle"]) {
  return vehicle === "busje" ? "Busje (tot 6 passagiers)" : "Auto (tot 4 passagiers)";
}

function pricingModeLabel(mode: string) {
  return mode === "special"
    ? "Vast tarief"
    : "Berekend op afstand en reistijd";
}

type ButtonVariant = "primary" | "gold" | "danger" | "outline";

function button(label: string, href: string, variant: ButtonVariant = "primary") {
  const styles: Record<ButtonVariant, { bg: string; color: string; border: string }> = {
    primary: { bg: BRAND.green, color: BRAND.white, border: BRAND.green },
    gold: { bg: BRAND.gold, color: BRAND.greenDark, border: BRAND.gold },
    danger: { bg: BRAND.red, color: BRAND.white, border: BRAND.red },
    outline: { bg: BRAND.white, color: BRAND.green, border: BRAND.green },
  };
  const s = styles[variant];

  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" class="btn" style="display:inline-table;margin:0 8px 10px 0;">
  <tr>
    <td align="center" bgcolor="${s.bg}" style="border-radius:999px;border:2px solid ${s.border};background:${s.bg};mso-padding-alt:12px 22px;">
      <a href="${href}" target="_blank" style="display:inline-block;padding:12px 22px;font-family:${FONT};font-size:15px;font-weight:700;line-height:1;color:${s.color};text-decoration:none;border-radius:999px;">${escapeHtml(
        label
      )}</a>
    </td>
  </tr>
</table>`.trim();
}

function statusBadge(status: "pending" | ReservationActionStatus) {
  const map = {
    pending: { label: "In behandeling", bg: BRAND.goldSoft, color: "#5b4a00", border: BRAND.gold },
    confirmed: { label: "Bevestigd", bg: BRAND.greenSoft, color: BRAND.green, border: BRAND.green },
    rejected: { label: "Afgewezen", bg: BRAND.redSoft, color: BRAND.red, border: BRAND.red },
  } as const;
  const s = map[status];

  return `<span style="display:inline-block;padding:6px 12px;border-radius:999px;background:${s.bg};border:1px solid ${s.border};font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${s.color};">${s.label}</span>`;
}

function sectionTitle(label: string) {
  return `<p style="margin:0 0 12px 0;font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND.green};">${escapeHtml(
    label
  )}</p>`;
}

function detailRow(label: string, value: string, options?: { strong?: boolean; last?: boolean }) {
  const border = options?.last ? "" : `border-bottom:1px solid ${BRAND.divider};`;
  const valueStyle = options?.strong
    ? `font-size:22px;font-weight:800;color:${BRAND.green};`
    : `font-size:15px;font-weight:700;color:${BRAND.ink};`;

  return `
<tr>
  <td class="stack stack-label" valign="top" style="padding:10px 0;${border}font-family:${FONT};font-size:14px;color:${BRAND.muted};width:44%;">${escapeHtml(
    label
  )}</td>
  <td class="stack stack-value" valign="top" align="right" style="padding:10px 0;${border}font-family:${FONT};${valueStyle}">${value}</td>
</tr>`.trim();
}

function addressBlock(label: string, value: string) {
  return `
<tr>
  <td style="padding:0 0 14px 0;">
    <p style="margin:0 0 4px 0;font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.muted};">${escapeHtml(
      label
    )}</p>
    <p style="margin:0;font-family:${FONT};font-size:16px;line-height:1.6;color:${BRAND.ink};">${escapeHtml(
      value
    )}</p>
  </td>
</tr>`.trim();
}

function card(innerHtml: string, options?: { background?: string; border?: string }) {
  const bg = options?.background ?? BRAND.panel;
  const border = options?.border ?? BRAND.border;

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px 0;">
  <tr>
    <td bgcolor="${bg}" style="background:${bg};border:1px solid ${border};border-radius:18px;padding:20px 22px;">
      ${innerHtml}
    </td>
  </tr>
</table>`.trim();
}

function reservationSummary(data: ReservationEmailData, status: "pending" | ReservationActionStatus) {
  const rows = [
    detailRow("Reserveringsnummer", `#${data.id}`),
    detailRow("Status", statusBadge(status)),
    detailRow("Ophaalmoment", escapeHtml(`${data.pickupDate} om ${data.pickupTime}`)),
    detailRow("Passagiers", escapeHtml(data.passengers)),
    detailRow("Voertuig", escapeHtml(vehicleLabel(data.vehicle))),
    detailRow("Afstand", escapeHtml(`${data.distanceKm} km`)),
    detailRow("Geschatte reistijd", escapeHtml(data.durationText)),
    detailRow("Tarief", escapeHtml(pricingModeLabel(data.pricingMode))),
    detailRow("Geschatte ritprijs", escapeHtml(formatEuro(data.priceTotal)), {
      strong: true,
      last: true,
    }),
  ].join("\n");

  const summaryCard = card(`
    ${sectionTitle("Ritgegevens")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${rows}
    </table>
  `);

  const routeCard = card(
    `
    ${sectionTitle("Route")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${addressBlock("Vertrekadres", data.pickup)}
      ${addressBlock("Aankomstadres", data.destination)}
      <tr>
        <td style="padding:0;">
          <p style="margin:0 0 4px 0;font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.muted};">Opmerking</p>
          <p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.7;color:${BRAND.muted};">${escapeHtml(
            data.notes || "Geen opmerkingen"
          )}</p>
        </td>
      </tr>
    </table>
  `,
    { background: BRAND.white }
  );

  const contactCard = card(`
    ${sectionTitle("Contactgegevens")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${detailRow("Naam", escapeHtml(data.customerName))}
      ${detailRow(
        "E-mail",
        `<a href="mailto:${escapeHtml(data.customerEmail)}" style="color:${BRAND.green};text-decoration:none;">${escapeHtml(
          data.customerEmail
        )}</a>`
      )}
      ${detailRow(
        "Telefoon",
        `<a href="tel:${escapeHtml(data.customerPhone)}" style="color:${BRAND.green};text-decoration:none;">${escapeHtml(
          data.customerPhone
        )}</a>`,
        { last: true }
      )}
    </table>
  `);

  return `${summaryCard}\n${routeCard}\n${contactCard}`;
}

function shell(params: {
  title: string;
  intro: string;
  eyebrow: string;
  preheader: string;
  innerHtml: string;
  footerNote?: string;
}) {
  const { title, intro, eyebrow, preheader, innerHtml, footerNote } = params;
  const year = new Date().getFullYear();

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html lang="nl" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(title)}</title>
    <!--[if mso]>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
    <style>table,td{font-family:Arial,Helvetica,sans-serif !important;} .btn{display:inline-block !important;}</style>
    <![endif]-->
    <style>
      body { margin:0; padding:0; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
      table { border-collapse:collapse; mso-table-lspace:0; mso-table-rspace:0; }
      img { border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
      a[x-apple-data-detectors] { color:inherit !important; text-decoration:none !important; }
      @media only screen and (max-width: 620px) {
        .container { width:100% !important; max-width:100% !important; }
        .px { padding-left:20px !important; padding-right:20px !important; }
        .hero-title { font-size:26px !important; line-height:1.25 !important; }
        .stack { display:block !important; width:100% !important; text-align:left !important; }
        .stack-value { padding-top:0 !important; }
        .stack-label { border-bottom:0 !important; padding-bottom:0 !important; }
        .hide-mobile { display:none !important; }
        .btn { display:block !important; width:100% !important; margin:0 0 10px 0 !important; }
        .btn a { display:block !important; text-align:center !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.cream};">
    <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${BRAND.cream};opacity:0;">${escapeHtml(
      preheader
    )}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.cream}" style="background:${BRAND.cream};">
      <tr>
        <td align="center" style="padding:28px 12px;">
          <!--[if mso]><table role="presentation" width="${CONTAINER_WIDTH}" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td><![endif]-->
          <table role="presentation" class="container" width="${CONTAINER_WIDTH}" cellpadding="0" cellspacing="0" border="0" style="width:${CONTAINER_WIDTH}px;max-width:${CONTAINER_WIDTH}px;">

            <!-- Header met logo -->
            <tr>
              <td bgcolor="${BRAND.greenDark}" class="px" style="background:${BRAND.greenDark};border-radius:24px 24px 0 0;padding:22px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="64" valign="middle" style="width:64px;padding-right:14px;">
                      <a href="${SITE_URL}" target="_blank" style="text-decoration:none;">
                        <img src="${LOGO_URL}" width="64" height="64" alt="${escapeHtml(
                          SITE_NAME
                        )} logo" style="display:block;width:64px;height:64px;border-radius:16px;border:2px solid ${BRAND.gold};" />
                      </a>
                    </td>
                    <td valign="middle">
                      <p style="margin:0;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;color:${BRAND.gold};">Taxi</p>
                      <p style="margin:2px 0 0 0;font-family:${FONT};font-size:22px;font-weight:800;line-height:1.1;color:${BRAND.white};">De Polder</p>
                    </td>
                    <td valign="middle" align="right" class="hide-mobile" style="font-family:${FONT};font-size:13px;color:rgba(255,255,255,0.75);white-space:nowrap;">
                      <a href="tel:${SITE_PHONE_RAW}" style="color:${BRAND.white};text-decoration:none;font-weight:700;">${escapeHtml(
                        SITE_PHONE_DISPLAY
                      )}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Titelvlak -->
            <tr>
              <td bgcolor="${BRAND.green}" class="px" style="background:${BRAND.green};padding:30px 32px 32px 32px;border-top:1px solid rgba(255,255,255,0.08);">
                <p style="margin:0 0 10px 0;font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:${BRAND.gold};">${escapeHtml(
                  eyebrow
                )}</p>
                <h1 class="hero-title" style="margin:0 0 10px 0;font-family:${FONT};font-size:30px;line-height:1.2;font-weight:800;color:${BRAND.white};">${escapeHtml(
                  title
                )}</h1>
                <p style="margin:0;font-family:${FONT};font-size:16px;line-height:1.7;color:rgba(255,255,255,0.86);">${escapeHtml(
                  intro
                )}</p>
              </td>
            </tr>

            <!-- Inhoud -->
            <tr>
              <td bgcolor="${BRAND.white}" class="px" style="background:${BRAND.white};padding:28px 32px 10px 32px;border-left:1px solid ${BRAND.border};border-right:1px solid ${BRAND.border};">
                ${innerHtml}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td bgcolor="${BRAND.white}" class="px" style="background:${BRAND.white};padding:8px 32px 28px 32px;border-left:1px solid ${BRAND.border};border-right:1px solid ${BRAND.border};border-bottom:1px solid ${BRAND.border};border-radius:0 0 24px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding:18px 0 0 0;border-top:1px solid ${BRAND.divider};">
                      <p style="margin:0 0 6px 0;font-family:${FONT};font-size:14px;font-weight:700;color:${BRAND.ink};">${escapeHtml(
                        SITE_NAME
                      )}</p>
                      <p style="margin:0 0 4px 0;font-family:${FONT};font-size:13px;line-height:1.7;color:${BRAND.muted};">
                        Schipholvervoer, lokale ritten en zakelijk vervoer &middot; 24/7 op afspraak
                      </p>
                      <p style="margin:0 0 4px 0;font-family:${FONT};font-size:13px;line-height:1.7;color:${BRAND.muted};">
                        <a href="tel:${SITE_PHONE_RAW}" style="color:${BRAND.green};text-decoration:none;font-weight:700;">${escapeHtml(
                          SITE_PHONE_DISPLAY
                        )}</a>
                        &nbsp;&middot;&nbsp;
                        <a href="${SITE_WHATSAPP_URL}" target="_blank" style="color:${BRAND.green};text-decoration:none;font-weight:700;">WhatsApp</a>
                        &nbsp;&middot;&nbsp;
                        <a href="mailto:${SITE_EMAIL}" style="color:${BRAND.green};text-decoration:none;font-weight:700;">${escapeHtml(
                          SITE_EMAIL
                        )}</a>
                      </p>
                      <p style="margin:0 0 12px 0;font-family:${FONT};font-size:13px;line-height:1.7;color:${BRAND.muted};">
                        <a href="${SITE_URL}" target="_blank" style="color:${BRAND.green};text-decoration:none;">${escapeHtml(
                          SITE_URL.replace(/^https?:\/\//, "")
                        )}</a>
                        &nbsp;&middot;&nbsp; KvK ${escapeHtml(SITE_KVK)}
                      </p>
                      <p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.6;color:#94a3b8;">
                        ${escapeHtml(
                          footerNote ??
                            "Dit bericht is automatisch verzonden door het reserveringssysteem van Taxi De Polder."
                        )}
                        &copy; ${year} ${escapeHtml(SITE_NAME)}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <!--[if mso]></td></tr></table><![endif]-->
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
}

function textSummary(data: ReservationEmailData, status: "pending" | ReservationActionStatus) {
  const statusLabel = {
    pending: "In behandeling",
    confirmed: "Bevestigd",
    rejected: "Afgewezen",
  }[status];

  return [
    "RITGEGEVENS",
    `Reserveringsnummer: #${data.id}`,
    `Status: ${statusLabel}`,
    `Ophaalmoment: ${data.pickupDate} om ${data.pickupTime}`,
    `Passagiers: ${data.passengers}`,
    `Voertuig: ${vehicleLabel(data.vehicle)}`,
    `Afstand: ${data.distanceKm} km`,
    `Geschatte reistijd: ${data.durationText}`,
    `Tarief: ${pricingModeLabel(data.pricingMode)}`,
    `Geschatte ritprijs: ${formatEuro(data.priceTotal)}`,
    "",
    "ROUTE",
    `Vertrekadres: ${data.pickup}`,
    `Aankomstadres: ${data.destination}`,
    `Opmerking: ${data.notes || "Geen opmerkingen"}`,
    "",
    "CONTACTGEGEVENS",
    `Naam: ${data.customerName}`,
    `E-mail: ${data.customerEmail}`,
    `Telefoon: ${data.customerPhone}`,
  ].join("\n");
}

function textFooter() {
  return [
    "--",
    SITE_NAME,
    "Schipholvervoer, lokale ritten en zakelijk vervoer - 24/7 op afspraak",
    `Telefoon: ${SITE_PHONE_DISPLAY}`,
    `WhatsApp: ${SITE_WHATSAPP_URL}`,
    `E-mail: ${SITE_EMAIL}`,
    `${SITE_URL} - KvK ${SITE_KVK}`,
  ].join("\n");
}

function buildText(title: string, intro: string, body: string[]) {
  return [`${SITE_NAME.toUpperCase()}`, "", title, intro, "", ...body, "", textFooter()].join(
    "\n"
  );
}

export function buildAdminReservationEmail(params: {
  reservation: ReservationEmailData;
  appUrl: string;
  actionToken: string;
}): RenderedEmail {
  const { reservation, appUrl, actionToken } = params;
  const confirmUrl = `${appUrl}/api/reservation-action?token=${actionToken}&decision=confirm`;
  const rejectUrl = `${appUrl}/api/reservation-action?token=${actionToken}&decision=reject`;
  const adminUrl = `${appUrl}/admin/reservations`;
  const replyUrl = `mailto:${encodeURIComponent(
    reservation.customerEmail
  )}?subject=${encodeURIComponent(`Re: reservering #${reservation.id}`)}`;

  const title = "Nieuwe reservering ontvangen";
  const intro = `${reservation.customerName} heeft een rit aangevraagd voor ${reservation.pickupDate} om ${reservation.pickupTime}. Beoordeel de aanvraag en bevestig of wijs af.`;

  const html = shell({
    eyebrow: `Reservering #${reservation.id}`,
    title,
    intro,
    preheader: `Nieuwe aanvraag van ${reservation.customerName}: ${reservation.pickup} naar ${reservation.destination}, ${formatEuro(
      reservation.priceTotal
    )}.`,
    innerHtml: `
      ${reservationSummary(reservation, "pending")}

      ${card(
        `
        ${sectionTitle("Actie vereist")}
        <p style="margin:0 0 16px 0;font-family:${FONT};font-size:15px;line-height:1.7;color:${BRAND.ink};">
          Met één klik bevestigt of weigert u deze reservering. De klant ontvangt daarna automatisch een e-mail met de uitkomst.
        </p>
        ${button("Bevestigen", confirmUrl, "primary")}
        ${button("Weigeren", rejectUrl, "danger")}
        ${button("Reageer per e-mail", replyUrl, "gold")}
        <p style="margin:6px 0 0 0;font-family:${FONT};font-size:14px;line-height:1.7;color:${BRAND.muted};">
          Liever alles in één overzicht? <a href="${adminUrl}" target="_blank" style="color:${BRAND.green};font-weight:700;text-decoration:none;">Open het admin overzicht</a>.
        </p>
      `,
        { background: BRAND.goldSoft, border: BRAND.gold }
      )}
    `,
    footerNote:
      "Dit bericht is automatisch verzonden door het reserveringssysteem van Taxi De Polder. De actieknoppen zijn alleen bedoeld voor de beheerder.",
  });

  const text = buildText(title.toUpperCase(), intro, [
    textSummary(reservation, "pending"),
    "",
    "ACTIE VEREIST",
    `Bevestigen: ${confirmUrl}`,
    `Weigeren: ${rejectUrl}`,
    `Admin overzicht: ${adminUrl}`,
  ]);

  return { html, text };
}

export function buildCustomerPendingEmail(
  reservation: ReservationEmailData
): RenderedEmail {
  const title = "Uw reservering is ontvangen";
  const intro =
    "Bedankt voor uw aanvraag bij Taxi De Polder. Wij controleren uw reservering en bevestigen deze zo snel mogelijk per e-mail.";

  const html = shell({
    eyebrow: `Reservering #${reservation.id}`,
    title,
    intro,
    preheader: `Wij hebben uw aanvraag voor ${reservation.pickupDate} om ${reservation.pickupTime} ontvangen.`,
    innerHtml: `
      ${card(
        `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-family:${FONT};font-size:15px;line-height:1.8;color:#5b4a00;">
              <strong>Uw reservering staat op &ldquo;in behandeling&rdquo;.</strong><br />
              U ontvangt een bevestiging of afwijzing per e-mail zodra wij uw aanvraag hebben beoordeeld. Nog niets ondernemen is nodig.
            </td>
          </tr>
        </table>
      `,
        { background: BRAND.goldSoft, border: BRAND.gold }
      )}

      ${reservationSummary(reservation, "pending")}

      ${card(`
        ${sectionTitle("Vragen of wijzigingen?")}
        <p style="margin:0 0 16px 0;font-family:${FONT};font-size:15px;line-height:1.7;color:${BRAND.ink};">
          Wilt u iets aanpassen of heeft u een vraag over uw rit? Neem gerust direct contact met ons op.
        </p>
        ${button("Bel direct", `tel:${SITE_PHONE_RAW}`, "primary")}
        ${button("WhatsApp", SITE_WHATSAPP_URL, "gold")}
      `)}
    `,
  });

  const text = buildText(title.toUpperCase(), intro, [
    "Uw reservering staat op 'in behandeling'. U ontvangt een bevestiging of afwijzing per e-mail.",
    "",
    textSummary(reservation, "pending"),
    "",
    `Vragen of wijzigingen? Bel ${SITE_PHONE_DISPLAY} of stuur een WhatsApp: ${SITE_WHATSAPP_URL}`,
  ]);

  return { html, text };
}

export function buildCustomerStatusEmail(params: {
  reservation: ReservationEmailData;
  status: ReservationActionStatus;
  adminNote?: string | null;
}): RenderedEmail {
  const { reservation, status, adminNote } = params;
  const confirmed = status === "confirmed";

  const title = confirmed
    ? "Uw reservering is bevestigd"
    : "Uw reservering is afgewezen";

  const intro = confirmed
    ? `Goed nieuws: uw rit op ${reservation.pickupDate} om ${reservation.pickupTime} is ingepland. Wij staan op tijd voor u klaar.`
    : `Helaas kunnen wij uw rit op ${reservation.pickupDate} om ${reservation.pickupTime} niet uitvoeren. Neem gerust contact met ons op voor een alternatief.`;

  const noteCard = adminNote
    ? card(`
        ${sectionTitle("Bericht van Taxi De Polder")}
        <p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.8;color:${BRAND.ink};">${escapeHtml(
          adminNote
        )}</p>
      `)
    : "";

  const highlight = confirmed
    ? card(
        `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-family:${FONT};font-size:15px;line-height:1.8;color:${BRAND.green};">
              <strong>Uw chauffeur staat op ${escapeHtml(
                `${reservation.pickupDate} om ${reservation.pickupTime}`
              )} klaar bij:</strong><br />
              ${escapeHtml(reservation.pickup)}
            </td>
          </tr>
        </table>
      `,
        { background: BRAND.greenSoft, border: BRAND.green }
      )
    : card(
        `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-family:${FONT};font-size:15px;line-height:1.8;color:${BRAND.red};">
              <strong>Deze reservering is niet ingepland.</strong><br />
              Wilt u een ander tijdstip of voertuig? Bel of app ons, dan kijken we samen naar een passende oplossing.
            </td>
          </tr>
        </table>
      `,
        { background: BRAND.redSoft, border: BRAND.red }
      );

  const html = shell({
    eyebrow: `Reservering #${reservation.id}`,
    title,
    intro,
    preheader: confirmed
      ? `Uw rit van ${reservation.pickup} naar ${reservation.destination} is bevestigd.`
      : `Uw aanvraag voor ${reservation.pickupDate} kon helaas niet worden ingepland.`,
    innerHtml: `
      ${highlight}
      ${noteCard}
      ${reservationSummary(reservation, status)}

      ${card(`
        ${sectionTitle(confirmed ? "Wijzigen of vragen?" : "Alternatief bespreken?")}
        <p style="margin:0 0 16px 0;font-family:${FONT};font-size:15px;line-height:1.7;color:${BRAND.ink};">
          ${
            confirmed
              ? "Verandert er iets aan uw planning? Laat het ons zo snel mogelijk weten, dan passen wij de rit aan."
              : "Wij helpen u graag aan een andere rit. Neem contact op en we zoeken een alternatief."
          }
        </p>
        ${button("Bel direct", `tel:${SITE_PHONE_RAW}`, "primary")}
        ${button("WhatsApp", SITE_WHATSAPP_URL, "gold")}
      `)}
    `,
  });

  const text = buildText(title.toUpperCase(), intro, [
    ...(adminNote ? ["BERICHT VAN TAXI DE POLDER", adminNote, ""] : []),
    textSummary(reservation, status),
    "",
    `Vragen? Bel ${SITE_PHONE_DISPLAY} of stuur een WhatsApp: ${SITE_WHATSAPP_URL}`,
  ]);

  return { html, text };
}
