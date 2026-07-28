-- Histórico de mensagens/atendimento por prospect
CREATE TABLE IF NOT EXISTS prospect_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id  UUID NOT NULL REFERENCES lumi_prospects(id) ON DELETE CASCADE,
  sender_type  TEXT NOT NULL CHECK (sender_type IN ('cliente', 'admin')),
  message      TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS prospect_messages_prospect_idx
  ON prospect_messages (prospect_id, created_at);

-- Data da última interação (admin → cliente)
ALTER TABLE lumi_prospects
  ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;
