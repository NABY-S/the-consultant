/**
 * Structured data (schema.org JSON-LD). Base.astro emits the organisation, website
 * and current page as one @graph; pages add their own nodes through `jsonLd`.
 * Nodes point at each other by @id so search engines read them as one entity.
 */
import { site } from './site';
import { services } from './services';
import { team } from './team';

export type JsonLd = Record<string, unknown>;

/** Absolute site root including the base path, without a trailing slash (e.g. https://naby-s.github.io/the-consultant). */
export const siteRoot = (site: URL | string | undefined) =>
  new URL(import.meta.env.BASE_URL, site ?? 'http://localhost').href.replace(/\/$/, '');

export const ids = (origin: string) => ({
  org: `${origin}/#organization`,
  website: `${origin}/#website`,
  person: (slug: string) => `${origin}/about/#${slug}`,
});

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export function organization(origin: string): JsonLd {
  const id = ids(origin);
  return {
    '@type': ['Organization', 'EducationalOrganization'],
    '@id': id.org,
    name: site.name,
    slogan: site.tagline,
    description: site.description,
    url: `${origin}/`,
    logo: { '@type': 'ImageObject', url: `${origin}/brand/icon-512.png`, width: 512, height: 512 },
    image: `${origin}/og.jpg`,
    email: site.email,
    telephone: site.phones[0].tel,
    address: { '@type': 'PostalAddress', addressCountry: 'GH' },
    areaServed: [{ '@type': 'Country', name: 'Ghana' }, 'Worldwide'],
    contactPoint: site.phones.map((p) => ({
      '@type': 'ContactPoint',
      telephone: p.tel,
      contactType: 'customer service',
      areaServed: 'GH',
      availableLanguage: ['English'],
    })),
    founder: team.map((m) => ({ '@id': id.person(slugify(m.name)) })),
    knowsAbout: [
      'Web development',
      'Custom software development',
      'Final year projects',
      'IT training',
      'Computer Science education',
      'Cloud computing',
      'Cybersecurity',
      'Data science',
      'Artificial intelligence',
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services',
      itemListElement: services.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.title, description: s.summary, url: `${origin}/services/#${s.slug}` },
      })),
    },
  };
}

export function people(origin: string): JsonLd[] {
  const id = ids(origin);
  return team.map((m) => ({
    '@type': 'Person',
    '@id': id.person(slugify(m.name)),
    name: m.name,
    jobTitle: m.role,
    worksFor: { '@id': id.org },
    email: `mailto:${m.email}`,
    sameAs: [m.github, m.linkedin].filter(Boolean),
    url: `${origin}/about/`,
  }));
}

export function website(origin: string): JsonLd {
  return {
    '@type': 'WebSite',
    '@id': ids(origin).website,
    url: `${origin}/`,
    name: site.name,
    description: site.description,
    inLanguage: 'en',
    publisher: { '@id': ids(origin).org },
  };
}
