import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { env } from 'cloudflare:workers';
import { handleSubmit } from '../../../lib/leads/submit';
import { applicationSchema } from '../../../lib/leads/schema';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const tracks = new Map((await getCollection('tracks')).map((t) => [t.id, t.data.title]));
  return handleSubmit({
    request,
    env,
    waitUntil: (p) => locals.cfContext.waitUntil(p),
    kind: 'application',
    schema: applicationSchema,
    thanksPath: '/apply/',
    validate: async (i) => (tracks.has(i.track) ? null : { track: 'Choose a training track from the list.' }),
    map: (i) => ({
      name: i.name,
      email: i.email,
      phone: i.phone,
      topic: tracks.get(i.track) ?? i.track,
      details: {
        level: i.level,
        grade: i.grade ?? '',
        track: i.track,
        startMonth: i.startMonth,
        guardianName: i.guardianName ?? '',
        guardianPhone: i.guardianPhone ?? '',
        notes: i.notes ?? '',
      },
    }),
  });
};
