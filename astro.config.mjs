// @ts-check
import { defineConfig } from 'astro/config';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import cloudflare from '@astrojs/cloudflare';

/**
 * Two deploy targets from one codebase:
 *
 * - `github-pages` (DEPLOY_TARGET=github-pages, set by .github/workflows/deploy.yml):
 *   plain static files served under https://naby-s.github.io/the-consultant/.
 *   No server, so the API routes and /admin are left out and both forms post to Google Forms.
 * - `cloudflare` (default): Cloudflare Workers with the lead API, D1 database and /admin.
 */
const target = process.env.DEPLOY_TARGET === 'github-pages' ? 'github-pages' : 'cloudflare';
const onPages = target === 'github-pages';
const base = onPages ? '/the-consultant' : '/';

/**
 * Server-only routes (they need the Worker runtime and D1), injected only for Cloudflare.
 * @type {import('astro').AstroIntegration}
 */
const serverRoutes = {
  name: 'server-routes',
  hooks: {
    'astro:config:setup': ({ injectRoute }) => {
      const routes = [
        ['/admin', 'admin/index.astro'],
        ['/api/v1/enquiries', 'api/v1/enquiries.ts'],
        ['/api/v1/applications', 'api/v1/applications.ts'],
        ['/api/v1/admin/leads', 'api/v1/admin/leads/index.ts'],
        ['/api/v1/admin/leads/[id]', 'api/v1/admin/leads/[id].ts'],
      ];
      for (const [pattern, file] of routes) injectRoute({ pattern, entrypoint: `./src/server-routes/${file}` });
    },
  },
};

/**
 * Pages hosts the site under a sub-path, but the markup links to root paths ("/contact/").
 * After the build, prefix root-relative URLs in HTML attributes with the base.
 * Script and style bodies are left alone so the CSP hashes stay valid.
 * @type {import('astro').AstroIntegration}
 */
const prefixBase = {
  name: 'prefix-base',
  hooks: {
    'astro:build:done': async ({ assets, dir }) => {
      const root = fileURLToPath(dir);
      const files = new Set();
      for (const urls of assets.values()) for (const u of urls) if (fileURLToPath(u).endsWith('.html')) files.add(fileURLToPath(u));
      files.add(`${root}404.html`);
      const attr = /(\s(?:href|src|action|poster|data-src)=")\/(?!\/)(?!the-consultant\/)/g;
      const srcset = /(\s(?:srcset|imagesrcset)=")([^"]*)"/g;
      const fixList = (/** @type {string} */ v) => v.split(',').map((part) => part.trim().replace(/^\/(?!\/)(?!the-consultant\/)/, `${base}/`)).join(', ');
      for (const file of files) {
        let html;
        try { html = await readFile(file, 'utf8'); } catch { continue; }
        // Split out <script>/<style> bodies; rewrite only the markup between them.
        const parts = html.split(/(<(script|style)\b[^>]*>[\s\S]*?<\/\2>)/i);
        for (let i = 0; i < parts.length; i += 3) {
          parts[i] = parts[i].replace(attr, `$1${base}/`).replace(srcset, (_, a, v) => `${a}${fixList(v)}"`);
        }
        // Opening tags of script/style elements can carry src/href too.
        for (let i = 1; i < parts.length; i += 3) {
          parts[i] = parts[i].replace(/^<[^>]*>/, (tag) => tag.replace(attr, `$1${base}/`));
        }
        await writeFile(file, parts.filter((_, i) => i % 3 !== 2).join(''));
      }
    },
  },
};

// https://astro.build/config
export default defineConfig({
  site: onPages ? 'https://naby-s.github.io' : 'https://the-consultant.workers.dev',
  base,
  trailingSlash: 'ignore',
  output: 'static',
  adapter: onPages ? undefined : cloudflare(),
  integrations: onPages ? [prefixBase] : [serverRoutes],
  vite: { define: { 'import.meta.env.DEPLOY_TARGET': JSON.stringify(target) } },
  // Prefetch every internal link on hover so page switches feel instant.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  security: {
    // Emits a CSP <meta> with hashes for every script and style Astro renders.
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        // docs.google.com: the forms post into Google Forms.
        "connect-src 'self' https://docs.google.com",
        'frame-src https://challenges.cloudflare.com',
        "form-action 'self' https://docs.google.com",
        "base-uri 'self'",
        "object-src 'none'",
      ],
      scriptDirective: { resources: ["'self'", 'https://challenges.cloudflare.com'] },
    },
  },
});
