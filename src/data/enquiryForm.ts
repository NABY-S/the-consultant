/**
 * Contact enquiries on GitHub Pages post into a Google Form ("Enquiries"), the same
 * way training applications do (see applicationForm.ts). Pages has no server, so this
 * replaces the /api/v1/enquiries endpoint there.
 *
 * Not set up yet: while `action` is null the contact form opens WhatsApp with the
 * message prefilled instead. To switch it on:
 *   1. Create a Google Form with these questions, in any order:
 *      - "What do you need help with?" (multiple choice, options exactly as `types` below)
 *      - "Name" (short answer), "Phone or WhatsApp" (short answer),
 *        "Email" (short answer), "Message" (paragraph)
 *   2. In the form: ⋮ → Get pre-filled link, fill dummy answers, copy the link.
 *   3. Paste the form's id into `action` (…/forms/d/e/<id>/formResponse) and each
 *      `entry.<number>` from the link into `fields`.
 */
export const enquiryForm = {
  action: null as string | null,
  fields: {
    type: null as string | null,
    name: null as string | null,
    phone: null as string | null,
    email: null as string | null,
    message: null as string | null,
  },
};

/** Ready to post: the form URL and every entry id are filled in. */
export const enquiryFormReady =
  !!enquiryForm.action && Object.values(enquiryForm.fields).every((id) => !!id);
