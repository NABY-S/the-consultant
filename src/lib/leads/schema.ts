import { z } from 'astro/zod';

export const ENQUIRY_TYPES = ['business', 'project', 'training', 'partnership', 'other'] as const;
export const LEVELS = ['JHS', 'SHS', 'University'] as const;
export const STATUSES = ['new', 'contacted', 'enrolled', 'closed', 'spam'] as const;

export const enquiryTypeLabels: Record<(typeof ENQUIRY_TYPES)[number], string> = {
  business: 'Website or software for a business',
  project: 'Final year or industrial project',
  training: 'Training enquiry',
  partnership: 'School or organisation partnership',
  other: 'Something else',
};

const trimmed = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label} needs at least ${min} characters.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

const optionalEmail = z
  .string()
  .trim()
  .max(254)
  .transform((v) => v || undefined)
  .pipe(z.email('Enter an email address like name@example.com.').optional());

// Ghana numbers (0XX XXX XXXX or +233 XX XXX XXXX), or any international number
// written with its + country code; spaces and dashes allowed.
const PHONE_RE = /^(?:(?:\+?233|0)[235]\d{8}|\+[1-9]\d{7,14})$/;
const optionalPhone = z
  .string()
  .trim()
  .max(20)
  .transform((v) => v.replace(/[\s-]/g, '') || undefined)
  .refine((v) => v === undefined || PHONE_RE.test(v), 'Enter a number like 024 123 4567, or +44… from abroad.')
  .optional();

const common = {
  email: optionalEmail.optional(),
  phone: optionalPhone,
  website: z.string().max(0, 'Leave this field empty.').optional(), // honeypot
  sourcePage: z.string().max(200).optional(),
};

const contactRequired = (v: { email?: string; phone?: string }) => Boolean(v.email || v.phone);
const contactIssue = { message: 'Give us a phone number or an email so we can reply.', path: ['phone'] };

// Every field of the "Send a message" form is required, matching the Enquiries Google Form.
export const enquirySchema = z
  .object({
    ...common,
    name: trimmed(2, 100, 'Your name'),
    type: z.enum(ENQUIRY_TYPES, 'Choose what you need help with.'),
    message: trimmed(10, 2000, 'Your message'),
  })
  .refine((v) => Boolean(v.phone), { message: 'Add a phone or WhatsApp number.', path: ['phone'] })
  .refine((v) => Boolean(v.email), { message: 'Add an email address.', path: ['email'] });

export const applicationSchema = z
  .object({
    ...common,
    name: trimmed(2, 100, 'Learner name'),
    level: z.enum(LEVELS, 'Choose a level.'),
    grade: z.string().trim().max(40).optional(),
    track: z.string().regex(/^[a-z0-9-]{2,60}$/, 'Choose a training track.'),
    startMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Choose a start month.'),
    guardianName: z.string().trim().max(100).optional(),
    guardianPhone: optionalPhone,
    notes: z.string().trim().max(1000, 'Notes must be 1,000 characters or fewer.').optional(),
  })
  .refine(contactRequired, contactIssue)
  .refine((v) => v.level === 'University' || Boolean(v.guardianName && v.guardianName.length >= 2), {
    message: 'For JHS and SHS learners, add a parent or guardian name.',
    path: ['guardianName'],
  })
  .refine((v) => v.level === 'University' || Boolean(v.guardianPhone), {
    message: 'For JHS and SHS learners, add a parent or guardian phone number.',
    path: ['guardianPhone'],
  });

export type EnquiryInput = z.infer<typeof enquirySchema>;
export type ApplicationInput = z.infer<typeof applicationSchema>;

/** Flattens zod issues into `{ field: firstMessage }` for inline form errors. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    out[key] ??= issue.message;
  }
  return out;
}
