# The Consultant — PRD

> Source of truth: [The Consultant — PRD & Architecture](https://claude.ai/artifact/BoGpRAjLmqokHo9YnewJFj) (Claude Docs, rev 19, exported 2026-09-25). Edit there, re-export here.

Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)

## Summary

The Consultant v2 turns a single static brochure page into a small, fast, lead-and-enrolment platform for a Ghana-based IT firm, keeping the current brand and page flow intact.

**Original idea (from the repo).** The existing site is one 118 KB `index.html` with inline CSS and base64 founder photos. It sells three things: websites and software for businesses, final-year and industrial projects for IT/CS students, and monthly training (JHS, SHS, university) across ten tracks. It follows a clear path: Idea → Research → Development → Documentation → Implementation. Every conversion leaves the site: WhatsApp DM, a Google Form for enrolment, and a `mailto:` contact form.

**What this refinement changes.**

- Conversions stay on-site: a native enquiry form and a native training application, each stored and acknowledged, with WhatsApp kept as the fast path.
- Content moves out of HTML into typed data files (services, tracks, team), so updates don't require editing markup.
- The build is static-first and served from a CDN edge, with one small serverless API for writes — the smallest design that meets the load, following system-design basics: separate reads from writes, cache everything static, make writes idempotent, and queue anything slow.
- Images move out of base64 into optimised files, cutting first load from \~120 KB of HTML to a small shell plus lazy assets.

## Problem and users

Today every lead leaves the site before it is captured, so the firm cannot count, follow up on, or learn from its demand. The Google Form, `mailto:` form and WhatsApp link all work, but none of them records where a visitor came from or what they asked for, and a `mailto:` form silently fails on phones with no mail app set up.

The page also carries all content in one file, so adding a training track or a cohort date means editing raw HTML.

| Persona | Who | Arrives wanting | Primary action |
| --- | --- | --- | --- |
| Student under deadline | Final-year or attachment IT/CS student, mostly on a mid-range Android phone and mobile data | Proof the firm can deliver a documented, defensible project on time | Enquiry: project type, deadline, institution |
| Parent or learner | Parent of a JHS/SHS pupil, or a university learner | Which track, which level, when it starts, what it costs | Training application |
| Small business owner | Shop, clinic, school or farm business in any sector | A website or internal tool at a clear price | Enquiry or WhatsApp DM |
| Institution lead | Head of a school or an organisation's training lead | Group training and a credible, compliant partner | Enquiry for a partnership call |
| Admin (internal) | Founders reviewing leads | One list of new leads, with status | Review and update leads |

Most visitors are mobile-first and bandwidth-sensitive: the design budget is a 3G-class connection, not office Wi-Fi.

## Goals, non-goals and metrics

The release succeeds if every lead is captured on-site and the founders can act on it within a working day.

**Goals**

1. Capture 100% of enquiries and training applications in the firm's own database, with a confirmation to the visitor.
2. Give each audience (student, learner, business, institution) its own page with a single clear next step.
3. Load fast on a mid-range Android over 3G: Largest Contentful Paint under 2.5 s, under 150 KB of JavaScript on any page.
4. Let a non-developer add a training track, service or team member by editing one Markdown or JSON file.

**Non-goals for v1**

- Online payments and fee checkout (quoted by WhatsApp or email instead).
- Student logins, a learning portal, or course video hosting.
- A full CMS. Content lives in the repo; a headless CMS is a later option.
- Multi-language content (English only in v1).

**Metrics**

| Metric | Target | How measured |
| --- | --- | --- |
| Enquiry + application submissions stored | 100% of successful submits | Database row per `201` response |
| Visitor-to-lead conversion | Baseline in month 1, then +25% | Privacy-friendly analytics events |
| Median time to first response | Under 24 h | `status` change timestamp on each lead |
| Largest Contentful Paint (p75, mobile) | Under 2.5 s | Real-user Web Vitals |
| Form spam reaching the inbox | Under 1% | Turnstile pass rate vs stored rows |
| Lighthouse accessibility | 95 or higher | CI check on every pull request |

## Functional requirements

MVP ships eight public routes, two stored forms and a minimal admin view; everything else waits for real usage data.

| ID | Requirement | Priority |
| --- | --- | --- |
| F1 | Home page keeps today's flow: hero with the Idea → Implementation path, services, training preview, apply band, contact | MVP |
| F2 | `/services` with one section per service line (business software, student projects, training) and a CTA prefilled to that line | MVP |
| F3 | `/training` lists all ten tracks from a content collection; `/training/[track]` shows modules, levels (JHS / SHS / University) and an apply button | MVP |
| F4 | `/about` with story, mission, vision and team cards from a data file | MVP |
| F5 | `/contact` enquiry form: name, phone or email (one required), enquiry type, message; stored, then a thank-you state | MVP |
| F6 | `/apply` training application: learner name, level, track, preferred start month, guardian contact for JHS/SHS; stored, then a reference number | MVP |
| F7 | WhatsApp deep link on every page, with a message prefilled from the page context | MVP |
| F8 | Spam defence: Cloudflare Turnstile, honeypot field, per-IP rate limit | MVP |
| F9 | New-lead notification to the support inbox within 1 minute | MVP |
| F10 | `/admin` behind Cloudflare Access: list leads, filter by type and status, change status | MVP |
| F11 | 404 page, privacy notice at /privacy (Act 843: what is collected, why, retention, deletion requests), Open Graph images, sitemap, structured data (`Organization`, `Course`) | MVP |
| F12 | Project showcase (`/work`) with case studies of delivered systems | Later |
| F13 | Cohort calendar with seat counts per track | Later |
| F14 | Mobile-money payment for training deposits | Later |
| F15 | Twi and other local-language content | Later |

The old Google Form stays linked as a fallback on `/apply` for one month after launch, then is removed.

## Non-functional requirements

| Area | Requirement |
| --- | --- |
| Performance | LCP under 2.5 s and CLS under 0.1 at p75 on mobile; under 150 KB JS per page; images served as AVIF/WebP with explicit width and height |
| Availability | Static pages served from CDN edge, 99.9% monthly; if the API is down, forms fall back to a WhatsApp link with the typed message |
| Latency | Form submit round-trip under 800 ms at p95 from Accra |
| Data retention | Leads kept 24 months, then deleted; visitors can ask for deletion by email |
| Privacy | Ghana Data Protection Act 2012 (Act 843): collect only what the forms need, state the purpose beside the submit button, no third-party ad trackers |
| Accessibility | WCAG 2.2 AA: visible focus, 4.5:1 text contrast, 44 px touch targets, labels on every input, full keyboard use, reduced-motion honoured |
| Browser support | Last two versions of Chrome, Safari, Firefox, Samsung Internet; Android 9+ |
| Security | HTTPS only, strict Content-Security-Policy, input validated on the server, no secrets in the client bundle |

## UX and UI direction

Keep the brand and the page flow people already know; fix the contrast failures, split the long page into routes, and add one motion idea that comes from the firm's own process.

**Kept from the current site.** Cream / ink / orange palette, Baloo 2 headings with Inter body, the dark sticky header, the rotated "Let's build it." highlight, the numbered training cards and the Home → About → Services → Apply → Contact order. The home page still works as a one-page summary; each section links to its full route.

**Audit findings and fixes** (UI/UX Pro Max checklist, Taste redesign audit, motion-web design gates):

| Finding | Measured | Fix |
| --- | --- | --- |
| White text on orange highlight | 2.52:1 (fails AA) | Ink on orange, 7.08:1 |
| Orange-deep labels on cream | 2.72:1 (fails AA) | New text-orange `#9A4A0C`, 5.1:1; bright orange kept for fills only |
| Three equal service cards | Generic pattern | Zig-zag rows on `/services`, one per audience |
| No focus rings, skip link, active nav state | Missing | Added as part of the component state matrix |
| `mailto:` contact form | Fails silently without a mail app | Stored form with loading, error, success states |
| No favicon, OG image, 404, sitemap | Missing | Added (F11) |
| 118 KB HTML with base64 photos | Blocks first paint | Optimised image files with fixed dimensions |

**Design tokens.** Three levels in CSS custom properties: primitives (`--cream`, `--ink`, `--orange`…), semantic roles (`--bg`, `--surface`, `--text`, `--text-accent`, `--focus`), and a few component tokens (`--btn-radius`). Components read only semantic roles. Styling stays hand-written CSS — no Tailwind — to match the existing codebase.

**Motion concept: "the path".** The firm's process (Idea → Research → Development → Documentation → Implementation) becomes the one signature interaction: a five-stop rail on the home page that an orange marker travels as you scroll, lighting each stage. It uses native CSS scroll-driven animation behind `@supports`, with the finished state as the default, so Firefox and reduced-motion users see a complete, static path. Beyond that: a spring "stamp" on the hero highlight, 150–250 ms state transitions, and a 40 ms stagger on card reveals. No WebGL, no animation library — total motion JS under 3 KB.

## Delivery plan and open questions

| Milestone | Scope | Exit check |
| --- | --- | --- |
| M1 — Foundation | Astro project, tokens, layout, header/footer, all eight routes with content from data files | Builds; every page passes the acceptance floor |
| M2 — Forms and API | Enquiry and application forms, `/api/v1/*`, D1 schema, validation, idempotency, rate limit | Duplicate submit returns the same reference; WhatsApp fallback works offline |
| M3 — Admin and notifications | Access-protected `/admin`, status changes, email outbox | A test lead reaches the inbox and the admin list |
| M4 — Polish and launch | OG images, sitemap, structured data, Lighthouse CI, Skylos gate, DNS cut-over | Metrics targets met on a real mid-range Android |

**Open questions**

- [ ] Which domain will the site live on, and who controls its DNS today?
- [ ] Should training prices be shown on the site, or quoted on request?
- [ ] Which inbox and which WhatsApp number should receive new-lead alerts?
- [ ] Can we use real photos of past projects or training sessions for `/work` and the training pages?
- [ ] MicroFish-En (a multi-agent simulation engine) was listed as a skill; it is a separate app that needs an LLM key and a Zep Cloud key. Do we want to use it later to test messaging against simulated student and parent personas, or drop it?

**Sources**

- [The Consultant repository](https://github.com/NABY-S/the-consultant) — original `index.html`
- [ByteByteGo, System Design: The Big Archive 2025 Edition (PDF)](https://blog.bytebytego.com/p/free-system-design-pdf-158-pages) — page numbers above refer to this PDF
- [motion-web skill](https://github.com/feitangyuan/motion-web) · [Skylos](https://github.com/duriantaco/skylos) · [MicroFish-En](https://github.com/ChinmayShringi/MicroFish-En)
