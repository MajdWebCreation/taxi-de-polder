import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "tdp_admin_session";

/**
 * Snelle, optimistische afscherming van het beheerpaneel: zonder sessiecookie
 * gaat de bezoeker meteen naar de loginpagina. De echte controle gebeurt
 * server-side in `requireAdmin()` en in elke /api/admin route, want de Edge
 * runtime kan de MySQL-sessie niet opzoeken.
 */
export function middleware(request: NextRequest) {
  const hasSessionCookie = Boolean(
    request.cookies.get(SESSION_COOKIE_NAME)?.value
  );

  if (!hasSessionCookie) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/((?!login).*)"],
};
