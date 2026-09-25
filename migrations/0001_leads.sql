-- Enquiries and training applications share one table, told apart by `kind`.
CREATE TABLE leads (
  id              TEXT PRIMARY KEY,
  reference       TEXT NOT NULL UNIQUE,
  idempotency_key TEXT NOT NULL UNIQUE,
  kind            TEXT NOT NULL CHECK (kind IN ('enquiry', 'application')),
  name            TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  topic           TEXT NOT NULL,
  details         TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new', 'contacted', 'enrolled', 'closed', 'spam')),
  source_page     TEXT,
  ip_hash         TEXT,
  notified_at     TEXT,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE INDEX leads_status_created ON leads (status, created_at DESC);
CREATE INDEX leads_created ON leads (created_at DESC);
CREATE INDEX leads_ip_created ON leads (ip_hash, created_at);
CREATE INDEX leads_unnotified ON leads (notified_at) WHERE notified_at IS NULL;
