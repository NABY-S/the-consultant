import type { APIRoute } from 'astro';

/** Generated so the sitemap URL always matches the configured site origin. */
export const GET: APIRoute = ({ site }) => {
  const origin = new URL(site!).origin;
  const body = `# Search engines and AI crawlers are welcome on public pages.
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: ${origin}/sitemap.xml

# Plain-text site summary for AI assistants: ${origin}/llms.txt
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
