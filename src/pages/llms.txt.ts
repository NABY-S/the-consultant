import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '../data/site';
import { services } from '../data/services';
import { team } from '../data/team';

/**
 * llms.txt (https://llmstxt.org): a plain-Markdown summary of the site for AI
 * assistants and answer engines. Built from the same data as the pages, so it
 * cannot drift out of date.
 */
export const GET: APIRoute = async ({ site: siteUrl }) => {
  const origin = new URL(siteUrl!).origin;
  const tracks = (await getCollection('tracks')).sort((a, b) => a.data.order - b.data.order);
  const link = (path: string) => `${origin}${path}`;

  const body = `# ${site.name}

> ${site.description}

${site.name} ("${site.tagline}") is a technology firm based in Ghana, serving clients locally and remotely. It builds websites and custom software for businesses, delivers final year and industrial attachment projects for IT and Computer Science students, and runs monthly IT training for learners at JHS, SHS and university level. Training is offered online, offline (in person) or hybrid, for 3, 6 or 9 months.

Contact: ${site.email} · ${site.phones.map((p) => `${p.display} (${p.tel})`).join(' · ')} · WhatsApp https://wa.me/${site.whatsapp}

## Services

${services.map((s) => `- [${s.title}](${link(`/services/#${s.slug}`)}): ${s.summary} (${s.audience}.)`).join('\n')}

## Training courses

${tracks.map((t) => `- [${t.data.title}](${link(`/training/${t.id}/`)}): ${t.data.summary} Levels: ${t.data.levels.join(', ')}. Modules: ${t.data.modules.join(', ')}.`).join('\n')}

## How a project runs

Idea → Research → Development → Documentation → Implementation. Every system ships with documentation; student projects are defence-ready.

## People

${team.map((m) => `- ${m.name}, ${m.role}${m.linkedin ? ` (${m.linkedin})` : ''}`).join('\n')}

## Key pages

- [Home](${link('/')})
- [Services](${link('/services/')})
- [Training courses](${link('/training/')})
- [Apply for training](${link('/apply/')}): online application, about three minutes
- [About](${link('/about/')})
- [Contact](${link('/contact/')})

## Optional

- [Privacy policy](${link('/privacy/')})
- [Terms of use](${link('/terms/')})
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
