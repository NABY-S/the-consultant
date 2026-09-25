export const site = {
  name: 'The Consultant',
  tagline: 'Where ideas become solutions',
  description:
    'Ghana-based technology firm building websites, software and final-year projects, and running IT & Computer Science training from JHS to university.',
  email: 'Theconsultantsupport@gmail.com',
  phones: [
    { display: '0548 935 585', tel: '+233548935585' },
    { display: '0241 619 116', tel: '+233241619116' },
  ],
  whatsapp: '233548935585',
  location: 'Ghana — serving clients locally & remotely',
  legacyApplicationForm: 'https://forms.gle/xLACQfXAq2BdzhuS7',
} as const;

export const nav = [
  { href: '/', label: 'Home' },
  { href: '/about/', label: 'About' },
  { href: '/services/', label: 'Services' },
  { href: '/training/', label: 'Training' },
  { href: '/contact/', label: 'Contact' },
] as const;

/** The firm's delivery process; drives the home page "path" rail. */
export const path = [
  { step: 'Idea', copy: 'You bring the problem, the brief or the half-formed thought.' },
  { step: 'Research', copy: 'We study the users, the constraints and what already exists.' },
  { step: 'Development', copy: 'We design and build it, showing you working versions as we go.' },
  { step: 'Documentation', copy: 'Every system ships with clear write-ups — defence-ready for students.' },
  { step: 'Implementation', copy: 'We deploy it, hand it over, and train the people who will run it.' },
] as const;

export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${site.whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
