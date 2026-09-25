import type { z } from 'astro/zod';
import { HttpError, errorResponse, json, readBody } from './http';
import { fieldErrors } from './schema';
import { enforceRateLimit, hashIp } from './security';
import { TURNSTILE_ENABLED, verifyTurnstile } from './turnstile';
import { insertLead, type LeadKind, type NewLead } from './repo';
import { flushOutbox } from './notify';

type SubmitEnv = Env & { TURNSTILE_SECRET_KEY: string; IP_HASH_SALT: string; RESEND_API_KEY?: string };

type Mapping<T> = (input: T) => Pick<NewLead, 'name' | 'email' | 'phone' | 'topic' | 'details'>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Shared POST handler for enquiries and applications:
 * parse → honeypot → validate → Turnstile → rate limit → idempotent insert → 201 → notify after response.
 * JSON callers get JSON; plain HTML form posts (no JavaScript) get a 303 redirect.
 */
export async function handleSubmit<S extends z.ZodType>(opts: {
  request: Request;
  env: SubmitEnv;
  waitUntil: (p: Promise<unknown>) => void;
  kind: LeadKind;
  schema: S;
  map: Mapping<z.infer<S>>;
  thanksPath: string;
  validate?: (input: z.infer<S>) => Promise<Record<string, string> | null>;
}): Promise<Response> {
  const { request, env, kind } = opts;
  let isJson = true;
  let source = '/';
  try {
    const body = await readBody(request);
    isJson = body.isJson;
    const data = body.data;
    source = safePath(data.sourcePage) ?? opts.thanksPath;

    // Honeypot filled: pretend success so bots learn nothing.
    if (data.website) return success(isJson, 'TC-00000', opts.thanksPath, 201);

    const parsed = opts.schema.safeParse(data);
    if (!parsed.success) throw new HttpError(400, 'invalid', 'Please check the highlighted fields.', fieldErrors(parsed.error));
    const extra = await opts.validate?.(parsed.data);
    if (extra) throw new HttpError(400, 'invalid', 'Please check the highlighted fields.', extra);

    const ip = request.headers.get('cf-connecting-ip');
    if (TURNSTILE_ENABLED) await verifyTurnstile(data['cf-turnstile-response'], env.TURNSTILE_SECRET_KEY, ip);

    const ipHash = await hashIp(ip, env.IP_HASH_SALT);
    await enforceRateLimit(env.DB, ipHash);

    const headerKey = request.headers.get('idempotency-key') ?? data.idempotencyKey;
    const idempotencyKey = headerKey && UUID_RE.test(headerKey) ? headerKey : crypto.randomUUID();

    const { lead, created } = await insertLead(env.DB, {
      ...opts.map(parsed.data),
      idempotencyKey,
      kind,
      sourcePage: source,
      ipHash,
    });

    if (created) opts.waitUntil(flushOutbox(env.DB, env));
    console.log(JSON.stringify({ level: 'info', msg: 'lead_stored', kind, reference: lead.reference, replay: !created }));
    return success(isJson, lead.reference, opts.thanksPath, created ? 201 : 200);
  } catch (err) {
    if (isJson) return errorResponse(err);
    // No-JS fallback: bounce back to the form with a generic error code.
    const code = err instanceof HttpError ? err.code : 'internal';
    return Response.redirect(new URL(`${source}?error=${encodeURIComponent(code)}`, request.url), 303);
  }

  function success(asJson: boolean, reference: string, thanks: string, status: number): Response {
    if (asJson) return json({ reference }, status);
    return Response.redirect(new URL(`${thanks}?ref=${reference}`, request.url), 303);
  }
}

function safePath(p: string | undefined): string | null {
  return p && /^\/[a-z0-9/_-]*$/i.test(p) && !p.startsWith('//') ? p : null;
}
