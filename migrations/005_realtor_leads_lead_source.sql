-- Adiciona rastreamento de origem do lead na tabela realtor_leads
-- Executar no Supabase SQL Editor

alter table realtor_leads
  add column if not exists lead_source text
    check (lead_source in ('buyer_form','seller_form','newsletter','ebook_download'));

create index if not exists realtor_leads_lead_source_idx on realtor_leads(lead_source);
