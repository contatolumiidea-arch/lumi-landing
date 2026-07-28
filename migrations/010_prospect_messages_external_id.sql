-- Adiciona external_id para deduplicação de webhooks inbound
ALTER TABLE prospect_messages
  ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;
