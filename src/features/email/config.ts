import { SITE_EMAIL, SITE_URL } from "@/lib/site";

const DEFAULT_RESERVATION_EMAIL = SITE_EMAIL;
const DEFAULT_FROM_EMAIL =
  "Taxi De Polder <reserveringen@notify.taxidepolder.nl>";
const DEFAULT_APP_URL = SITE_URL;

function getTrimmedEnv(name: string) {
  return process.env[name]?.trim();
}

export function getReservationEmailConfig() {
  return {
    resendApiKey: getTrimmedEnv("RESEND_API_KEY") || null,
    toEmail:
      getTrimmedEnv("RESERVATION_TO_EMAIL") || DEFAULT_RESERVATION_EMAIL,
    fromEmail:
      getTrimmedEnv("RESERVATION_FROM_EMAIL") || DEFAULT_FROM_EMAIL,
    replyTo:
      getTrimmedEnv("RESERVATION_REPLY_TO") || DEFAULT_RESERVATION_EMAIL,
    appUrl: getTrimmedEnv("APP_URL") || DEFAULT_APP_URL,
  };
}
