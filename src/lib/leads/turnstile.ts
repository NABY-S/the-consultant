import { HttpError } from './http';

/**
 * Cloudflare Turnstile spam check, currently switched off: the widget did not fit
 * the form well on small screens. The honeypot and per-IP rate limit still apply.
 * Set to true to bring the widget (LeadForm) and the server check (submit) back.
 */
export const TURNSTILE_ENABLED = false;

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile(token: string | undefined, secret: string, ip: string | null): Promise<void> {
  if (!token) throw new HttpError(403, 'challenge_missing', 'Please complete the spam check and try again.');
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);

  const res = await fetch(VERIFY_URL, { method: 'POST', body });
  const outcome = (await res.json()) as { success: boolean; 'error-codes'?: string[] };
  if (!outcome.success) {
    throw new HttpError(403, 'challenge_failed', 'The spam check did not pass. Please refresh the page and try again.');
  }
}
