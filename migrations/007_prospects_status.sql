-- Expande os status disponíveis em lumi_prospects
-- Mantém compatibilidade com os registros existentes (new, contacted, converted)

ALTER TABLE lumi_prospects
  DROP CONSTRAINT IF EXISTS lumi_prospects_status_check;

ALTER TABLE lumi_prospects
  ADD CONSTRAINT lumi_prospects_status_check
    CHECK (status IN ('new', 'contacted', 'potential', 'closed', 'archived', 'converted'));
