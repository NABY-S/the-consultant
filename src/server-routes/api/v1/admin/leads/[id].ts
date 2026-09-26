import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { requireAdmin } from '../../../../../lib/leads/access';
import { HttpError, errorResponse, json, readBody } from '../../../../../lib/leads/http';
import { updateStatus, type LeadStatus } from '../../../../../lib/leads/repo';
import { STATUSES } from '../../../../../lib/leads/schema';

export const prerender = false;

export const PATCH: APIRoute = async ({ request, params }) => {
  try {
    const admin = await requireAdmin(request, env, import.meta.env.DEV);
    // CSRF: admin auth rides on a cookie, so only same-origin JSON writes are accepted.
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin) throw new HttpError(403, 'forbidden', 'Cross-site request refused.');
    const { data, isJson } = await readBody(request);
    if (!isJson) throw new HttpError(415, 'unsupported_type', 'Send JSON.');
    if (!STATUSES.includes(data.status as LeadStatus)) {
      throw new HttpError(400, 'invalid', 'Unknown status.', { status: `Use one of: ${STATUSES.join(', ')}.` });
    }
    const lead = await updateStatus(env.DB, params.id ?? '', data.status as LeadStatus);
    if (!lead) throw new HttpError(404, 'not_found', 'Lead not found.');
    console.log(JSON.stringify({ level: 'info', msg: 'lead_status', reference: lead.reference, status: lead.status, by: admin }));
    return json(lead);
  } catch (err) {
    return errorResponse(err);
  }
};
