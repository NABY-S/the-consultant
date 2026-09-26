import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { handleSubmit } from '../../../lib/leads/submit';
import { enquirySchema, enquiryTypeLabels } from '../../../lib/leads/schema';

export const prerender = false;

export const POST: APIRoute = ({ request, locals }) =>
  handleSubmit({
    request,
    env,
    waitUntil: (p) => locals.cfContext.waitUntil(p),
    kind: 'enquiry',
    schema: enquirySchema,
    thanksPath: '/contact/',
    map: (i) => ({
      name: i.name,
      email: i.email,
      phone: i.phone,
      topic: enquiryTypeLabels[i.type],
      details: { message: i.message },
    }),
  });
