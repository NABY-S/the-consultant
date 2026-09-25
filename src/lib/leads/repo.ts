import { newId, newReference } from './ids';
import type { STATUSES } from './schema';

export type LeadKind = 'enquiry' | 'application';
export type LeadStatus = (typeof STATUSES)[number];

export type NewLead = {
  idempotencyKey: string;
  kind: LeadKind;
  name: string;
  email?: string;
  phone?: string;
  topic: string;
  details: Record<string, unknown>;
  sourcePage?: string;
  ipHash: string | null;
};

export type Lead = {
  id: string;
  reference: string;
  kind: LeadKind;
  name: string;
  email: string | null;
  phone: string | null;
  topic: string;
  details: string;
  status: LeadStatus;
  source_page: string | null;
  notified_at: string | null;
  created_at: string;
  updated_at: string;
};

// Columns returned to callers; ip_hash and idempotency_key stay internal.
const COLUMNS = `id, reference, kind, name, email, phone, topic, details, status, source_page, notified_at, created_at, updated_at`;

/**
 * Inserts a lead once per idempotency key. A retry with the same key returns
 * the original row instead of creating a duplicate.
 */
export async function insertLead(db: D1Database, lead: NewLead): Promise<{ lead: Lead; created: boolean }> {
  const existing = await findByIdempotencyKey(db, lead.idempotencyKey);
  if (existing) return { lead: existing, created: false };

  // Reference collisions are ~1 in 33M; retry a couple of times rather than fail.
  for (let attempt = 0; attempt < 3; attempt++) {
    const row = await db
      .prepare(
        `INSERT INTO leads (id, reference, idempotency_key, kind, name, email, phone, topic, details, source_page, ip_hash)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
         ON CONFLICT DO NOTHING
         RETURNING ${COLUMNS}`,
      )
      .bind(
        newId(),
        newReference(),
        lead.idempotencyKey,
        lead.kind,
        lead.name,
        lead.email ?? null,
        lead.phone ?? null,
        lead.topic,
        JSON.stringify(lead.details),
        lead.sourcePage ?? null,
        lead.ipHash,
      )
      .first<Lead>();
    if (row) return { lead: row, created: true };

    // Conflict: either a concurrent retry with the same key won, or the reference collided.
    const raced = await findByIdempotencyKey(db, lead.idempotencyKey);
    if (raced) return { lead: raced, created: false };
  }
  throw new Error('Could not allocate a unique reference');
}

function findByIdempotencyKey(db: D1Database, key: string): Promise<Lead | null> {
  return db.prepare(`SELECT ${COLUMNS} FROM leads WHERE idempotency_key = ?1`).bind(key).first<Lead>();
}

export type ListFilter = { kind?: LeadKind; status?: LeadStatus; cursor?: string; limit?: number };

export async function listLeads(db: D1Database, f: ListFilter): Promise<{ items: Lead[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(f.limit ?? 50, 1), 100);
  const where: string[] = [];
  const params: unknown[] = [];
  if (f.kind) {
    params.push(f.kind);
    where.push(`kind = ?${params.length}`);
  }
  if (f.status) {
    params.push(f.status);
    where.push(`status = ?${params.length}`);
  }
  const cursor = decodeCursor(f.cursor);
  if (cursor) {
    params.push(cursor.createdAt, cursor.id);
    where.push(`(created_at, id) < (?${params.length - 1}, ?${params.length})`);
  }
  params.push(limit + 1);
  const sql = `SELECT ${COLUMNS} FROM leads ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
               ORDER BY created_at DESC, id DESC LIMIT ?${params.length}`;
  const { results } = await db.prepare(sql).bind(...params).all<Lead>();
  const items = results.slice(0, limit);
  const last = items.at(-1);
  return { items, nextCursor: results.length > limit && last ? encodeCursor(last) : null };
}

export async function updateStatus(db: D1Database, id: string, status: LeadStatus): Promise<Lead | null> {
  return db
    .prepare(
      `UPDATE leads SET status = ?1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ?2 RETURNING ${COLUMNS}`,
    )
    .bind(status, id)
    .first<Lead>();
}

export async function pendingNotifications(db: D1Database, limit = 10): Promise<Lead[]> {
  const { results } = await db
    .prepare(`SELECT ${COLUMNS} FROM leads WHERE notified_at IS NULL ORDER BY created_at LIMIT ?1`)
    .bind(limit)
    .all<Lead>();
  return results;
}

export async function markNotified(db: D1Database, ids: string[]): Promise<void> {
  if (!ids.length) return;
  const stmt = db.prepare(`UPDATE leads SET notified_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?1`);
  await db.batch(ids.map((id) => stmt.bind(id)));
}

function encodeCursor(lead: Lead): string {
  return btoa(`${lead.created_at}|${lead.id}`).replace(/=+$/, '');
}

function decodeCursor(raw?: string): { createdAt: string; id: string } | null {
  if (!raw) return null;
  try {
    const [createdAt, id] = atob(raw).split('|');
    if (createdAt && id && /^[0-9A-Z]{26}$/.test(id)) return { createdAt, id };
  } catch {
    /* fall through */
  }
  return null;
}
