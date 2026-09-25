import { markNotified, pendingNotifications, type Lead } from './repo';

type NotifyEnv = { RESEND_API_KEY?: string; NOTIFY_TO: string; NOTIFY_FROM: string };

/**
 * Outbox flush: sends an email for every lead not yet notified. Runs after the
 * response (waitUntil), so a slow or failing mail provider never blocks a visitor;
 * anything left unsent is picked up on the next submission.
 */
export async function flushOutbox(db: D1Database, env: NotifyEnv): Promise<void> {
  const pending = await pendingNotifications(db);
  const sent: string[] = [];
  for (const lead of pending) {
    try {
      await send(lead, env);
      sent.push(lead.id);
    } catch (err) {
      console.error(JSON.stringify({ level: 'warn', msg: 'notify_failed', reference: lead.reference, error: String(err) }));
      break; // provider is likely down; stop and retry on the next flush
    }
  }
  await markNotified(db, sent);
}

async function send(lead: Lead, env: NotifyEnv): Promise<void> {
  const subject = `New ${lead.kind} ${lead.reference}: ${lead.topic}`;
  if (!env.RESEND_API_KEY) {
    // No provider configured (local dev): log metadata only, never form contents.
    console.log(JSON.stringify({ level: 'info', msg: 'notify_skipped_no_provider', reference: lead.reference }));
    return;
  }
  const details = JSON.parse(lead.details) as Record<string, unknown>;
  const lines = [
    `Reference: ${lead.reference}`,
    `Type: ${lead.kind} — ${lead.topic}`,
    `Name: ${lead.name}`,
    `Phone: ${lead.phone ?? '—'}`,
    `Email: ${lead.email ?? '—'}`,
    ...Object.entries(details).map(([k, v]) => `${k}: ${String(v)}`),
    '',
    `Received: ${lead.created_at}`,
  ];
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.NOTIFY_FROM, to: [env.NOTIFY_TO], subject, text: lines.join('\n') }),
  });
  if (!res.ok) throw new Error(`resend ${res.status}`);
}
