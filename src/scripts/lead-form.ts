const WHATSAPP = '233548935585';

// Cast rather than generic-query: Workers' global `Element` type clashes with HTMLSelectElement.
type FormControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const messages: Record<string, string> = {
  challenge_missing: 'Please complete the spam check and try again.',
  challenge_failed: 'The spam check did not pass. Please refresh the page and try again.',
  rate_limited: 'Too many messages from this connection. Please wait a few minutes.',
  invalid: 'Please check the highlighted fields.',
  internal: 'Something went wrong on our side. Please try again.',
};

type ApiError = { error: { code: string; message: string; fields?: Record<string, string> } };

type Turnstile = {
  render: (el: HTMLElement, opts: Record<string, string>) => string;
  reset: (id?: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

export function initLeadForms(): void {
  const roots = document.querySelectorAll<HTMLElement>('[data-lead-form]');
  roots.forEach(init);
  if (roots.length) loadTurnstile().then(() => roots.forEach(renderChallenge));
}

let turnstileLoading: Promise<void> | null = null;
function loadTurnstile(): Promise<void> {
  turnstileLoading ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('turnstile'));
    document.head.append(s);
  });
  return turnstileLoading.catch(() => undefined);
}

// Explicit render so small phones get the compact widget: the normal one needs 300px.
function renderChallenge(root: HTMLElement): void {
  const el = root.querySelector<HTMLElement>('.turnstile');
  const ts = window.turnstile;
  if (!el || !ts) return;
  const draw = () => {
    const size = el.clientWidth < 300 ? 'compact' : 'flexible';
    if (el.dataset.size === size) return;
    if (el.dataset.widgetId) ts.remove(el.dataset.widgetId);
    el.dataset.size = size;
    el.dataset.widgetId = ts.render(el, { sitekey: el.dataset.sitekey ?? '', theme: 'light', size });
  };
  draw();
  // Rotation or resize can shrink the form below the flexible widget's 300px floor.
  let pending = 0;
  new ResizeObserver(() => {
    clearTimeout(pending);
    pending = window.setTimeout(draw, 100);
  }).observe(root);
}

function init(root: HTMLElement): void {
  const form = root.querySelector('form')!;
  const summary = form.querySelector<HTMLElement>('.summary')!;
  const button = form.querySelector<HTMLButtonElement>('.submit')!;
  const label = button.querySelector<HTMLElement>('.label')!;
  const idleLabel = label.textContent ?? 'Send';
  const fallback = form.querySelector<HTMLElement>('.fallback')!;
  const success = root.querySelector<HTMLElement>('.success')!;
  const keyInput = form.querySelector<HTMLInputElement>('input[name="idempotencyKey"]')!;

  // One key per filled-in form: a double tap or a retry after a timeout cannot create two leads.
  keyInput.value = crypto.randomUUID();

  const params = new URLSearchParams(location.search);
  const ref = params.get('ref');
  if (ref && /^TC-[0-9A-Z]{5}$/.test(ref)) return showSuccess(ref);
  const err = params.get('error');
  if (err) showSummary(messages[err] ?? messages.internal);

  // Validate on blur, not on every keystroke.
  form.querySelectorAll('input, textarea, select').forEach((node) => {
    const el = node as FormControl;
    el.addEventListener('blur', () => {
      if (el.getAttribute('aria-invalid') === 'true' || el.value) setFieldError(el.name, el.checkValidity() ? '' : localMessage(el));
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const invalid = [...form.querySelectorAll('input, textarea, select')].map((n) => n as FormControl).filter((el) => !el.checkValidity());
    if (invalid.length) {
      invalid.forEach((el) => setFieldError(el.name, localMessage(el)));
      showSummary(messages.invalid);
      invalid[0].focus();
      return;
    }

    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    setBusy(true);
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': keyInput.value },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        const { reference } = (await res.json()) as { reference: string };
        return showSuccess(reference);
      }
      if (res.status >= 500) return showFallback(data);
      const body = (await res.json().catch(() => null)) as ApiError | null;
      const fields = body?.error.fields ?? {};
      Object.entries(fields).forEach(([k, v]) => setFieldError(k, v));
      showSummary(body?.error.message ?? messages.internal);
      const first = Object.keys(fields)[0];
      (first ? form.querySelector<HTMLElement>(`[name="${CSS.escape(first)}"]`) : summary)?.focus();
      // A spent Turnstile token cannot be reused.
      window.turnstile?.reset(form.querySelector<HTMLElement>('.turnstile')?.dataset.widgetId);
    } catch {
      showFallback(data);
    } finally {
      setBusy(false);
    }
  });

  function setBusy(busy: boolean) {
    button.disabled = busy;
    button.setAttribute('aria-busy', String(busy));
    label.textContent = busy ? 'Sending…' : idleLabel;
  }

  function showSummary(text: string) {
    summary.textContent = text;
    summary.hidden = false;
  }

  function clearErrors() {
    summary.hidden = true;
    fallback.hidden = true;
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    form.querySelectorAll('.error').forEach((el) => (el.textContent = ''));
  }

  function setFieldError(name: string, message: string) {
    const input = form.querySelector<HTMLElement>(`[name="${CSS.escape(name)}"]`);
    const slot = form.querySelector<HTMLElement>(`#f-${CSS.escape(name)}-error`);
    if (!input || !slot) return;
    slot.textContent = message;
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  function showFallback(data: Record<string, string>) {
    const lines = [form.dataset.fallbackIntro ?? 'Hello The Consultant,'];
    for (const [k, v] of Object.entries(data)) {
      if (!v || ['website', 'idempotencyKey', 'sourcePage', 'cf-turnstile-response'].includes(k)) continue;
      lines.push(`${k}: ${v}`);
    }
    fallback.querySelector<HTMLAnchorElement>('a')!.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`;
    fallback.hidden = false;
    fallback.querySelector<HTMLAnchorElement>('a')!.focus();
  }

  function showSuccess(reference: string) {
    form.hidden = true;
    success.querySelector('.ref')!.textContent = reference;
    success.hidden = false;
    success.querySelector<HTMLElement>('h2')!.focus();
  }
}

function localMessage(el: FormControl): string {
  const v = el.validity;
  if (v.valueMissing) return el.tagName === 'SELECT' ? 'Choose an option.' : 'This field is required.';
  if (v.typeMismatch && el.type === 'email') return 'Enter an email address like name@example.com.';
  if (v.tooShort) return `Use at least ${(el as HTMLInputElement).minLength} characters.`;
  if (v.patternMismatch) return el.title || 'Check the format.';
  return el.validationMessage;
}
