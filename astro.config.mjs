// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  // Placeholder until the production domain is decided (see PRD open questions).
  site: 'https://the-consultant.workers.dev',
  output: 'static',
  adapter: cloudflare(),
  // Prefetch every internal link on hover so page switches feel instant.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  security: {
    // Emits a CSP <meta> with hashes for every script and style Astro renders.
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        // docs.google.com: the training application posts into the existing Google Form.
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
