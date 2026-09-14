import "server-only";
import { execute, queryOne } from "@/lib/db/mysql";

export type AdminUserRow = {
  id: number;
  email: string;
  password_hash: string;
};

export type AdminSessionRow = {
  admin_user_id: number;
  email: string;
  expires_at: Date;
};

export async function selectAdminUserByEmail(
  email: string
): Promise<AdminUserRow | null> {
  return queryOne<AdminUserRow>(
    `SELECT id, email, password_hash FROM admin_users WHERE email = ?`,
    [email]
  );
}

export async function insertAdminSession(params: {
  tokenHash: string;
  adminUserId: number;
  expiresAt: Date;
}): Promise<void> {
  await execute(
    `INSERT INTO admin_sessions (token_hash, admin_user_id, expires_at)
     VALUES (?, ?, ?)`,
    [params.tokenHash, params.adminUserId, params.expiresAt]
  );
}

/**
 * Haalt een nog geldige sessie op. Verlopen sessies leveren niets op, ook
 * als de opruimtaak ze nog niet verwijderd heeft.
 */
export async function selectActiveAdminSession(
  tokenHash: string
): Promise<AdminSessionRow | null> {
  return queryOne<AdminSessionRow>(
    `SELECT s.admin_user_id, u.email, s.expires_at
       FROM admin_sessions s
       JOIN admin_users u ON u.id = s.admin_user_id
      WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP(3)`,
    [tokenHash]
  );
}

export async function touchAdminSession(params: {
  tokenHash: string;
  expiresAt: Date;
}): Promise<void> {
  await execute(
    `UPDATE admin_sessions
        SET expires_at = ?, last_seen_at = UTC_TIMESTAMP(3)
      WHERE token_hash = ?`,
    [params.expiresAt, params.tokenHash]
  );
}

export async function deleteAdminSession(tokenHash: string): Promise<void> {
  await execute(`DELETE FROM admin_sessions WHERE token_hash = ?`, [tokenHash]);
}

export async function deleteExpiredAdminSessions(): Promise<void> {
  await execute(`DELETE FROM admin_sessions WHERE expires_at <= UTC_TIMESTAMP(3)`);
}
