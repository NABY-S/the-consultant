<p align="center">
  <img src="public/brand/logo.png" alt="The Consultant: where ideas become solutions" width="440" />
</p>

<p align="center">
  Websites and software for businesses, final year projects for IT and Computer Science students,<br />
  and IT training from JHS to university. Based in Ghana.
</p>

<p align="center">
  <a href="https://naby-s.github.io/the-consultant/"><strong>Live site</strong></a> ·
  <a href="docs/ARCHITECTURE.md">Architecture</a> ·
  <a href="docs/PRD.md">Product requirements</a>
</p>

---

## What the site does

| Page | Purpose |
|---|---|
| Home | What The Consultant builds and teaches, and how a project runs from idea to implementation |
| Services | Business websites and software, final year and industrial projects, monthly training |
| Training | Ten course tracks, each with its modules and levels (JHS, SHS, University) |
| Apply | Three-step training application, sent straight to the team's Google Form |
| Contact | Enquiry form, plus call, WhatsApp and email |
| About | Mission, vision and the founders |
| Privacy, Terms | Legal pages under Ghana's Data Protection Act, 2012 (Act 843) |

The site also publishes `sitemap.xml`, `robots.txt` and `llms.txt`, and structured data (Organization, Course, BreadcrumbList and more) on every page.

## Built with

- [Astro](https://astro.build): content collections for the course tracks, no client framework
- Plain CSS with design tokens: graphite neutrals, one orange accent, Geist and Geist Mono
- Native view transitions between pages, hover prefetch, responsive down to 320px
- Google Forms as the form backend on GitHub Pages
- Optional Cloudflare Workers backend: lead API, D1 database, admin page, Turnstile, Resend email

## Hosting

One codebase, two deploy targets, chosen by the `DEPLOY_TARGET` environment variable.

| | GitHub Pages (live) | Cloudflare Workers (optional) |
|---|---|---|
| Build | `DEPLOY_TARGET=github-pages npm run build` | `npm run build` |
| URL | `https://naby-s.github.io/the-consultant/` | set `site` in `astro.config.mjs` |
| Training applications | Google Form | Google Form |
| Contact enquiries | Google Form (WhatsApp until it is set up) | Lead API, saved to D1 with a reference number |
| `/admin` lead dashboard | Not available | Behind Cloudflare Access |

**GitHub Pages** deploys automatically on every push to `main` through [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). In the repository settings, *Pages → Build and deployment → Source* must be **GitHub Actions**. Because Pages serves the site under `/the-consultant/`, a small build step prefixes internal links with that path. Write links as normal root paths (`/contact/`).

## Run it locally

Requires Node.js 22.12 or newer.

```sh
npm install
cp .dev.vars.example .dev.vars   # only needed for the Cloudflare backend
npm run dev                      # http://localhost:4321
```

| Command | Action |
|---|---|
| `npm run dev` | Dev server with the Cloudflare backend (API, `/admin`, local D1) |
| `npm run build` | Build for Cloudflare Workers |
| `DEPLOY_TARGET=github-pages npm run build` | Build the static GitHub Pages version into `dist/` |
| `npx astro check` | Type-check the project |

## Where things live

```text
src/
├── pages/            Public pages, sitemap.xml, robots.txt, llms.txt
├── server-routes/    API and /admin, added only to the Cloudflare build
├── content/tracks/   One Markdown file per training track
├── components/       Header, footer, heroes, form fields, cards
├── data/             Site details, services, team, SEO, Google Form ids
├── lib/leads/        Lead validation, storage, rate limiting, notifications
├── scripts/          Form behaviour in the browser
└── styles/           Global tokens and base styles
public/               Logo, icons, share image, hero photos
migrations/           D1 database schema
```

## Common edits

- **Contact details, tagline:** `src/data/site.ts`
- **A training track:** edit or add a file in `src/content/tracks/`
- **Team members and their links:** `src/data/team.ts`
- **Training application questions:** the Google Form ids in `src/data/applicationForm.ts`. Questions the Google Form doesn't have yet are sent inside the "Current Location" answer until their ids are added.
- **Contact form on GitHub Pages:** create an "Enquiries" Google Form and add its ids to `src/data/enquiryForm.ts` (steps are in the file). Until then the form opens WhatsApp with the message filled in.

## Contributors

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/naby-s"><img src="https://github.com/naby-s.png?size=120" width="96" alt="" /><br /><strong>Samuel Yeboah Agyemang Badu</strong></a><br />
      Founder<br />
      <a href="https://github.com/naby-s">@naby-s</a>
    </td>
    <td align="center">
      <a href="https://github.com/lyon7sarbah"><img src="https://github.com/lyon7sarbah.png?size=120" width="96" alt="" /><br /><strong>Precious Sarbah</strong></a><br />
      Co-Founder<br />
      <a href="https://github.com/lyon7sarbah">@lyon7sarbah</a>
    </td>
  </tr>
</table>

## Contact

Theconsultantsupport@gmail.com · 0548 935 585 · 0241 619 116 · [WhatsApp](https://wa.me/233548935585)
