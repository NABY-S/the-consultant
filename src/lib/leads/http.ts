export type FieldErrors = Record<string, string>;

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields?: FieldErrors,
    readonly headers?: HeadersInit,
  ) {
    super(message);
  }
}

const baseHeaders = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };

export function json(body: unknown, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...baseHeaders, ...headers } });
}

export function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    return json({ error: { code: err.code, message: err.message, fields: err.fields } }, err.status, err.headers);
  }
  console.error(JSON.stringify({ level: 'error', msg: 'unhandled', error: String(err) }));
  return json({ error: { code: 'internal', message: 'Something went wrong on our side. Please try again.' } }, 500);
}

const MAX_BODY_BYTES = 16 * 1024;

/** Reads a JSON or form-encoded body into a flat string map, with a size cap. */
export async function readBody(request: Request): Promise<{ data: Record<string, string>; isJson: boolean }> {
  const length = Number(request.headers.get('content-length') ?? '0');
  if (length > MAX_BODY_BYTES) throw new HttpError(413, 'too_large', 'That message is too long.');

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new HttpError(413, 'too_large', 'That message is too long.');

  const type = request.headers.get('content-type') ?? '';
  if (type.includes('application/json')) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new HttpError(400, 'bad_json', 'The request could not be read.');
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new HttpError(400, 'bad_json', 'The request could not be read.');
    }
    const data: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) if (typeof v === 'string') data[k] = v;
    return { data, isJson: true };
  }
  if (type.includes('application/x-www-form-urlencoded')) {
    return { data: Object.fromEntries(new URLSearchParams(text)), isJson: false };
  }
  throw new HttpError(415, 'unsupported_type', 'Unsupported content type.');
}
