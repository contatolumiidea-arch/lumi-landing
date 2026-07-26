-- Migration 001: add UNIQUE constraint on lumi_onboarding.client_id
-- Required for upsert with onConflict: 'client_id' to work (Supabase error 42P10)

ALTER TABLE lumi_onboarding
  ADD CONSTRAINT lumi_onboarding_client_id_key UNIQUE (client_id);
