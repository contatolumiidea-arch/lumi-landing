-- Adiciona colunas de reset de senha na tabela de admins
ALTER TABLE lumi_admin_users
  ADD COLUMN IF NOT EXISTS reset_token        TEXT,
  ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMPTZ;
