import { NextRequest, NextResponse } from "next/server";
import {
  createAdminSession,
  verifyAdminCredentials,
} from "@/features/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: unknown;
      password?: unknown;
    };

    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-mailadres en wachtwoord zijn verplicht." },
        { status: 400 }
      );
    }

    const admin = await verifyAdminCredentials({ email, password });

    if (!admin) {
      // Bewust één algemene melding: geen onderscheid tussen een onbekend
      // account en een verkeerd wachtwoord.
      return NextResponse.json(
        { error: "Onjuist e-mailadres of wachtwoord." },
        { status: 401 }
      );
    }

    await createAdminSession(admin.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Inloggen mislukt. Probeer het opnieuw." },
      { status: 500 }
    );
  }
}
