export type Service = {
  slug: 'business' | 'projects' | 'training';
  title: string;
  audience: string;
  summary: string;
  points: string[];
  cta: { label: string; href: string };
  icon: 'screen' | 'cap' | 'book';
};

export const services: Service[] = [
  {
    slug: 'business',
    title: 'Websites & software for business',
    audience: 'For shops, clinics, schools, farms and firms',
    summary:
      'We design and build digital solutions for businesses of any size or industry — from a first website to internal systems that run your operations.',
    points: [
      'Business & e-commerce websites',
      'Custom software & internal tools',
      'Systems for industrial and institutional use',
    ],
    cta: { label: 'Discuss a business project', href: '/contact/?type=business' },
    icon: 'screen',
  },
  {
    slug: 'projects',
    title: 'Final year & industrial projects',
    audience: 'For IT and Computer Science students',
    summary:
      'Full support from proposal through to a finished, documented system ready for defence. You understand every part of what you present.',
    points: [
      'Topic research & proposal writing',
      'Development & implementation',
      'Full project documentation',
    ],
    cta: { label: 'Start a student project', href: '/contact/?type=project' },
    icon: 'cap',
  },
  {
    slug: 'training',
    title: 'Monthly training courses',
    audience: 'For JHS, SHS and university learners',
    summary:
      'Ongoing IT & Computer Science training built for each learning stage, taught in practical, project-based sessions.',
    points: ['JHS1 – JHS3', 'SHS1 – SHS3', 'University level (IT & CS)'],
    cta: { label: 'Browse training tracks', href: '/training/' },
    icon: 'book',
  },
];
