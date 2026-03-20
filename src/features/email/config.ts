const DEFAULT_RESERVATION_EMAIL = "m.hammid2004@gmail.com";
const DEFAULT_FROM_EMAIL =
  "Taxi De Polder <reserveringen@notify.taxidepolder.nl>";
const DEFAULT_APP_URL = "https://www.taxidepolder.nl";

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
