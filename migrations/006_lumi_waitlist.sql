-- Lista de espera: interessados no LUMI FLOW CRM e futuros produtos
CREATE TABLE IF NOT EXISTS lumi_waitlist (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT,
  email      TEXT NOT NULL,
  source     TEXT NOT NULL DEFAULT 'lumi_flow_waitlist',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email, source)
);

-- Índices para consultas administrativas
CREATE INDEX IF NOT EXISTS idx_waitlist_source    ON lumi_waitlist (source);
CREATE INDEX IF NOT EXISTS idx_waitlist_email     ON lumi_waitlist (email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created   ON lumi_waitlist (created_at DESC);
