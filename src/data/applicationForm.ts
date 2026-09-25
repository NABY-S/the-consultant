/**
 * The training application posts straight into the existing Google Form
 * ("Training Application Form"), so responses keep landing in its Sheet.
 *
 * Entry ids and option strings are copied from the live form and must match it
 * exactly: Google rejects answers that are not one of a question's options.
 * If a question is edited in Google Forms, update it here too.
 */

/**
 * Questions the site asks that the Google Form does not have yet. While an id is
 * `null`, the answer is folded into `foldInto` as "Label: value" so nothing is lost.
 * To give one its own column: add a question to the Google Form, then paste its
 * entry id here (open the form's "Get pre-filled link" to see the `entry.…` ids).
 */
const pending: Record<'level' | 'grade' | 'email' | 'guardianName' | 'guardianPhone' | 'startMonth' | 'notes', string | null> = {
  level: null,
  grade: null,
  email: null,
  guardianName: null,
  guardianPhone: null,
  startMonth: null,
  notes: null,
};

const fields = {
  name: 'entry.654557453',
  phone: 'entry.648198994',
  location: 'entry.1088111018',
  gender: 'entry.722480779',
  program: 'entry.1653430359',
  duration: 'entry.184794803',
  mode: 'entry.239776751',
};

export const applicationForm = {
  action:
    'https://docs.google.com/forms/d/e/1FAIpQLSdGomZUQtRTh5tMBp964aYUjUKESq4kS81SoKscWlNqrrrcDA/formResponse',
  /** Field `name` attributes: a Google entry id, or `extra.<key>` for a folded answer. */
  fields: {
    ...fields,
    ...(Object.fromEntries(Object.entries(pending).map(([k, id]) => [k, id ?? `extra.${k}`])) as Record<keyof typeof pending, string>),
  },
  /** Free-text question that carries folded answers until they get their own. */
  foldInto: fields.location,
  levels: ['JHS', 'SHS', 'University'],
  gender: ['Male', 'Female'],
  duration: ['3 months', '6 months', '9 months'],
  mode: ['Online', 'Offline', 'Hybrid'],
  /** Google option value → label shown on the site, keyed by training track id for ?track= links. */
  programs: [
    { track: 'web-development', value: 'Web Development', label: 'Web Development' },
    { track: 'cloud-computing', value: 'Cloud Computing', label: 'Cloud Computing' },
    { track: 'llms-and-ai', value: 'LLMS & AI', label: 'LLMs & AI' },
    { track: 'digital-marketing', value: 'Digital Marketing', label: 'Digital Marketing' },
    { track: 'data-science', value: 'Data Science & Analytics', label: 'Data Science & Analytics' },
    { track: 'cyber-security', value: 'Cybersecurity', label: 'Cybersecurity' },
    { track: 'devops', value: 'Devops Engineering', label: 'DevOps Engineering' },
    { track: 'mobile-apps', value: 'Mobile App Development', label: 'Mobile App Development' },
    { track: 'software-testing', value: 'Software Testing', label: 'Software Testing' },
  ],
} as const;
