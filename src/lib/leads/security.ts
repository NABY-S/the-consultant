import { HttpError } from './http';

export const RATE_LIMIT = { max: 5, windowMinutes: 10 } as const;

/** Salted SHA-256 of the client IP: enough to rate-limit, not enough to identify. */
export async function hashIp(ip: string | null, salt: string): Promise<string | null> {
  if (!ip) return null;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${ip}`));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

export async function enforceRateLimit(db: D1Database, ipHash: string | null): Promise<void> {
  if (!ipHash) return;
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM leads
       WHERE ip_hash = ?1 AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?2)`,
    )
    .bind(ipHash, `-${RATE_LIMIT.windowMinutes} minutes`)
    .first<{ n: number }>();
  if ((row?.n ?? 0) >= RATE_LIMIT.max) {
    throw new HttpError(429, 'rate_limited', 'Too many messages from this connection. Please wait a few minutes.', undefined, {
      'Retry-After': String(RATE_LIMIT.windowMinutes * 60),
    });
  }
}
