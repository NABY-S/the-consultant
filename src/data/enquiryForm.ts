/**
 * Contact enquiries on GitHub Pages post into a Google Form ("Enquiries"), the same
 * way training applications do (see applicationForm.ts). Pages has no server, so this
 * replaces the /api/v1/enquiries endpoint there.
 *
 * All five questions are required in the Google Form, as they are on the site.
 * If `action` is ever set back to null, the contact form opens WhatsApp with the
 * message prefilled instead. To point it at a different form:
 *   1. Create a Google Form with these questions, in any order:
 *      - "What do you need help with?" (multiple choice, options exactly as `types` below)
 *      - "Name" (short answer), "Phone or WhatsApp" (short answer),
 *        "Email" (short answer), "Message" (paragraph)
 *   2. In the form: ⋮ → Get pre-filled link, fill dummy answers, copy the link.
 *   3. Paste the form's id into `action` (…/forms/d/e/<id>/formResponse) and each
 *      `entry.<number>` from the link into `fields`.
 */
export const enquiryForm = {
  action: 'https://docs.google.com/forms/d/e/1FAIpQLSf2Ijf-5-n7Cd4wjg8HLwC-pdW6rZLphZFjynm9rqVUJYA9zQ/formResponse' as string | null,
  fields: {
    type: 'entry.1972728287' as string | null,
    name: 'entry.1405889162' as string | null,
    phone: 'entry.143357322' as string | null,
    email: 'entry.772719051' as string | null,
    message: 'entry.1344061610' as string | null,
  },
};

/** Ready to post: the form URL and every entry id are filled in. */
export const enquiryFormReady =
  !!enquiryForm.action && Object.values(enquiryForm.fields).every((id) => !!id);
