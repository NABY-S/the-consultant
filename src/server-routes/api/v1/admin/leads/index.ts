import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { requireAdmin } from '../../../../../lib/leads/access';
import { errorResponse, json } from '../../../../../lib/leads/http';
import { listLeads, type LeadKind, type LeadStatus } from '../../../../../lib/leads/repo';
import { STATUSES } from '../../../../../lib/leads/schema';

export const prerender = false;

export const GET: APIRoute = async ({ request, url }) => {
  try {
    await requireAdmin(request, env, import.meta.env.DEV);
    const kind = url.searchParams.get('kind');
    const status = url.searchParams.get('status');
    const page = await listLeads(env.DB, {
      kind: kind === 'enquiry' || kind === 'application' ? (kind as LeadKind) : undefined,
      status: STATUSES.includes(status as LeadStatus) ? (status as LeadStatus) : undefined,
      cursor: url.searchParams.get('cursor') ?? undefined,
      limit: Number(url.searchParams.get('limit')) || undefined,
    });
    return json(page);
  } catch (err) {
    return errorResponse(err);
  }
};
