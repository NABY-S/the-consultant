import { HttpError } from './http';

type AccessEnv = { ACCESS_TEAM_DOMAIN: string; ACCESS_AUD: string; DEV_ADMIN_BYPASS?: string };
type Jwk = JsonWebKey & { kid: string };

let jwksCache: { keys: Jwk[]; fetchedAt: number } | null = null;
const JWKS_TTL_MS = 60 * 60 * 1000;

function b64urlDecode(input: string): Uint8Array<ArrayBuffer> {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  const bin = atob(input.replace(/-/g, '+').replace(/_/g, '/') + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function getKeys(team: string, force = false): Promise<Jwk[]> {
  if (!force && jwksCache && Date.now() - jwksCache.fetchedAt < JWKS_TTL_MS) return jwksCache.keys;
  const res = await fetch(`https://${team}/cdn-certs/jwks.json`);
  if (!res.ok) throw new HttpError(503, 'auth_unavailable', 'Sign-in service unavailable.');
  const { keys } = (await res.json()) as { keys: Jwk[] };
  jwksCache = { keys, fetchedAt: Date.now() };
  return keys;
}

/**
 * Verifies the Cloudflare Access JWT on admin requests. Access already blocks
 * unauthenticated traffic at the edge; this is the second lock, so a misrouted
 * request to the Worker still fails closed. Returns the signed-in email.
 */
export async function requireAdmin(request: Request, env: AccessEnv, isDev: boolean): Promise<string> {
  if (isDev && env.DEV_ADMIN_BYPASS === 'true') return 'dev@localhost';
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) {
    throw new HttpError(503, 'auth_not_configured', 'Admin access is not configured.');
  }

  const token = request.headers.get('cf-access-jwt-assertion');
  if (!token) throw new HttpError(401, 'unauthenticated', 'Sign in required.');
  const [h, p, s] = token.split('.');
  if (!h || !p || !s) throw new HttpError(401, 'unauthenticated', 'Sign in required.');

  const header = JSON.parse(new TextDecoder().decode(b64urlDecode(h))) as { kid?: string; alg?: string };
  if (header.alg !== 'RS256' || !header.kid) throw new HttpError(401, 'unauthenticated', 'Sign in required.');

  let jwk = (await getKeys(env.ACCESS_TEAM_DOMAIN)).find((k) => k.kid === header.kid);
  jwk ??= (await getKeys(env.ACCESS_TEAM_DOMAIN, true)).find((k) => k.kid === header.kid); // key rotation
  if (!jwk) throw new HttpError(401, 'unauthenticated', 'Sign in required.');

  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlDecode(s), new TextEncoder().encode(`${h}.${p}`));
  if (!valid) throw new HttpError(401, 'unauthenticated', 'Sign in required.');

  const claims = JSON.parse(new TextDecoder().decode(b64urlDecode(p))) as {
    aud?: string | string[];
    exp?: number;
    iss?: string;
    email?: string;
  };
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  const now = Math.floor(Date.now() / 1000);
  if (!aud.includes(env.ACCESS_AUD) || !claims.exp || claims.exp < now || claims.iss !== `https://${env.ACCESS_TEAM_DOMAIN}`) {
    throw new HttpError(401, 'unauthenticated', 'Sign in required.');
  }
  return claims.email ?? 'unknown';
}
