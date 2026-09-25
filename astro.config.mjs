// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Placeholder until the production domain is decided (see PRD open questions).
  site: 'https://the-consultant.workers.dev',
  output: 'static',
  adapter: cloudflare(),
  integrations: [
    sitemap({ filter: (page) => !page.includes('/admin') }),
  ],
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  security: {
    // Emits a CSP <meta> with hashes for every script and style Astro renders.
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        'frame-src https://challenges.cloudflare.com',
        "form-action 'self'",
        "base-uri 'self'",
        "object-src 'none'",
      ],
      scriptDirective: { resources: ["'self'", 'https://challenges.cloudflare.com'] },
    },
  },
});
