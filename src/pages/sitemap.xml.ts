import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

/**
 * Single sitemap for the whole site. Pages are listed here rather than discovered,
 * so private routes (/admin, /api) and the 404 page can never leak in.
 */
const pages: { path: string; priority: number; changefreq: 'weekly' | 'monthly' | 'yearly' }[] = [
  { path: '/', priority: 1.0, changefreq: 'weekly' },
  { path: '/services/', priority: 0.9, changefreq: 'monthly' },
  { path: '/training/', priority: 0.9, changefreq: 'weekly' },
  { path: '/apply/', priority: 0.8, changefreq: 'monthly' },
  { path: '/about/', priority: 0.7, changefreq: 'monthly' },
  { path: '/contact/', priority: 0.7, changefreq: 'yearly' },
  { path: '/privacy/', priority: 0.3, changefreq: 'yearly' },
  { path: '/terms/', priority: 0.3, changefreq: 'yearly' },
];

export const GET: APIRoute = async ({ site }) => {
  const origin = new URL(site!).origin;
  const lastmod = new Date().toISOString().slice(0, 10);
  const tracks = (await getCollection('tracks')).sort((a, b) => a.data.order - b.data.order);
  const entries = [
    ...pages,
    ...tracks.map((t) => ({ path: `/training/${t.id}/`, priority: 0.8, changefreq: 'monthly' as const })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries
  .map(
    (e) => `  <url>
    <loc>${origin}${e.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority.toFixed(1)}</priority>${
      e.path === '/'
        ? `
    <image:image><image:loc>${origin}/images/hero-code-review-2000.jpg</image:loc></image:image>`
        : ''
    }
  </url>`,
  )
  .join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
