import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import {
  deleteAdminSession,
  deleteExpiredAdminSessions,
  insertAdminSession,
  selectActiveAdminSession,
  selectAdminUserByEmail,
  touchAdminSession,
} from "@/features/auth/repository";
import { hashPassword, verifyPassword } from "@/features/auth/password";

export const SESSION_COOKIE_NAME = "tdp_admin_session";

/** Zeven dagen, met verlenging zodra de sessie nog maar half geldig is. */
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_REFRESH_THRESHOLD_MS = SESSION_TTL_MS / 2;

const TOKEN_BYTES = 32;

export type AdminSession = {
  adminUserId: number;
  email: string;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function cookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: isProduction(),
    // Lax houdt de sessie geldig bij de e-mailactielinks, die als gewone
    // top-level navigatie binnenkomen, maar blokkeert cross-site POSTs.
    sameSite: "lax" as const,
    path: "/",
    expires,
  };
}

// Bij een onbekend e-mailadres wordt alsnog een volledige hashberekening
// uitgevoerd, zodat de responstijd niet verraadt of het account bestaat.
// Lazy, zodat een cold start die alleen een sessie leest geen scrypt draait.
let dummyHashPromise: Promise<string> | null = null;

function getDummyHash(): Promise<string> {
  dummyHashPromise ??= hashPassword(randomBytes(24).toString("hex"));

  return dummyHashPromise;
}

export async function verifyAdminCredentials(params: {
  email: string;
  password: string;
}): Promise<{ id: number; email: string } | null> {
  const email = params.email.trim().toLowerCase();
  const admin = await selectAdminUserByEmail(email);

  if (!admin) {
    await verifyPassword(params.password, await getDummyHash());
    return null;
  }

  const passwordMatches = await verifyPassword(
    params.password,
    admin.password_hash
  );

  if (!passwordMatches) {
    return null;
  }

  return { id: admin.id, email: admin.email };
}

export async function createAdminSession(adminUserId: number): Promise<void> {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await insertAdminSession({
    tokenHash: hashToken(token),
    adminUserId,
    expiresAt,
  });

  // Best effort: houdt de sessietabel klein zonder eigen cron-taak.
  void deleteExpiredAdminSessions().catch(() => undefined);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, cookieOptions(expiresAt));
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);
  const session = await selectActiveAdminSession(tokenHash);

  if (!session) {
    return null;
  }

  const expiresAt = new Date(session.expires_at);
  const remainingMs = expiresAt.getTime() - Date.now();

  if (remainingMs < SESSION_REFRESH_THRESHOLD_MS) {
    await touchAdminSession({
      tokenHash,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    });
  }

  return { adminUserId: session.admin_user_id, email: session.email };
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await deleteAdminSession(hashToken(token));
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}
