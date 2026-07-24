-- ═══════════════════════════════════════════════════════════════
-- LUMI IDEA — Schema do Banco de Dados
-- Executar no Supabase SQL Editor (Project → SQL Editor → New query)
-- ═══════════════════════════════════════════════════════════════

-- Extensão para geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- Função auxiliar para auto-atualizar updated_at
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ─────────────────────────────────────────────────────────────
-- 1. LUMI_ADMIN_USERS — Equipe interna LUMI
--    Separado de qualquer dado de corretor ou cliente.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE lumi_admin_users (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           TEXT        UNIQUE NOT NULL,
  password_hash   TEXT        NOT NULL,
  name            TEXT        NOT NULL,
  role            TEXT        NOT NULL DEFAULT 'support'
                              CHECK (role IN ('admin', 'support')),
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE lumi_admin_users IS 'Usuários internos da equipe LUMI. Acesso exclusivo ao painel administrativo.';


-- ─────────────────────────────────────────────────────────────
-- 2. LUMI_CLIENTS — Corretores clientes da plataforma
-- ─────────────────────────────────────────────────────────────
CREATE TABLE lumi_clients (
  id                       UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_customer_id       TEXT        UNIQUE,
  full_name                TEXT        NOT NULL,
  email                    TEXT        UNIQUE NOT NULL,
  phone                    TEXT,
  business_name            TEXT,
  country                  TEXT        NOT NULL DEFAULT 'US',
  client_status            TEXT        NOT NULL DEFAULT 'new'
                                       CHECK (client_status IN (
                                         'new',
                                         'pending_onboarding',
                                         'in_production',
                                         'review',
                                         'published',
                                         'canceled'
                                       )),
  notes                    TEXT,
  purchased_at             TIMESTAMPTZ,
  onboarding_completed_at  TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lumi_clients_email  ON lumi_clients(email);
CREATE INDEX idx_lumi_clients_status ON lumi_clients(client_status);
CREATE INDEX idx_lumi_clients_stripe ON lumi_clients(stripe_customer_id);

CREATE TRIGGER trg_lumi_clients_updated_at
  BEFORE UPDATE ON lumi_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE lumi_clients IS 'Corretores que assinaram a plataforma LUMI LANDING.';


-- ─────────────────────────────────────────────────────────────
-- 3. LUMI_SUBSCRIPTIONS — Assinaturas Stripe
--    Separado de lumi_clients para suportar múltiplos planos,
--    upgrades e histórico de pagamentos no futuro.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE lumi_subscriptions (
  id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id               UUID        NOT NULL REFERENCES lumi_clients(id) ON DELETE CASCADE,
  stripe_subscription_id  TEXT        UNIQUE,
  stripe_customer_id      TEXT,
  plan_type               TEXT        NOT NULL
                                      CHECK (plan_type IN ('monthly', 'annual')),
  status                  TEXT        NOT NULL DEFAULT 'active'
                                      CHECK (status IN (
                                        'active',
                                        'canceled',
                                        'past_due',
                                        'trialing',
                                        'incomplete'
                                      )),
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  canceled_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lumi_subscriptions_client ON lumi_subscriptions(client_id);
CREATE INDEX idx_lumi_subscriptions_status ON lumi_subscriptions(status);

CREATE TRIGGER trg_lumi_subscriptions_updated_at
  BEFORE UPDATE ON lumi_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE lumi_subscriptions IS 'Assinaturas Stripe de cada corretor. Um cliente pode ter histórico de múltiplas assinaturas.';


-- ─────────────────────────────────────────────────────────────
-- 4. LANDING_PAGES — Landing pages dos corretores
--    Preparado para múltiplas páginas por cliente no futuro.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE landing_pages (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id         UUID        NOT NULL REFERENCES lumi_clients(id) ON DELETE CASCADE,
  template_id       TEXT        NOT NULL DEFAULT 'template-01',
  status            TEXT        NOT NULL DEFAULT 'draft'
                                CHECK (status IN (
                                  'draft',
                                  'in_production',
                                  'review',
                                  'published',
                                  'paused'
                                )),
  published_url     TEXT,
  custom_domain     TEXT,
  language_primary  TEXT        NOT NULL DEFAULT 'en',
  languages_enabled TEXT[]      NOT NULL DEFAULT ARRAY['en'],
  notes             TEXT,
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_landing_pages_client ON landing_pages(client_id);
CREATE INDEX idx_landing_pages_status ON landing_pages(status);

CREATE TRIGGER trg_landing_pages_updated_at
  BEFORE UPDATE ON landing_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE landing_pages IS 'Landing pages criadas pela equipe LUMI para cada corretor.';


-- ─────────────────────────────────────────────────────────────
-- 5. LUMI_ONBOARDING — Dados preenchidos no wizard
-- ─────────────────────────────────────────────────────────────
CREATE TABLE lumi_onboarding (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id       UUID        NOT NULL REFERENCES lumi_clients(id) ON DELETE CASCADE,
  step1_business  JSONB,
  step2_template  JSONB,
  step3_brand     JSONB,
  step4_languages TEXT[],
  step5_details   JSONB,
  step6_services  TEXT[],
  step7_leadgen   JSONB,
  step8_ebook     JSONB,
  step9_crm       JSONB,
  social_links    JSONB,
  testimonials    JSONB,
  properties      JSONB,
  current_step    INTEGER     NOT NULL DEFAULT 1,
  status          TEXT        NOT NULL DEFAULT 'in_progress'
                              CHECK (status IN ('in_progress', 'completed')),
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lumi_onboarding_client ON lumi_onboarding(client_id);

CREATE TRIGGER trg_lumi_onboarding_updated_at
  BEFORE UPDATE ON lumi_onboarding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE lumi_onboarding IS 'Dados preenchidos pelo corretor no wizard de onboarding. Salvos progressivamente a cada passo.';


-- ─────────────────────────────────────────────────────────────
-- 6. REALTOR_LEADS — Leads gerados pelas landing pages
--    (Sistema dos corretores — base futura do CRM LUMI FLOW)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE realtor_leads (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id        UUID        REFERENCES lumi_clients(id) ON DELETE SET NULL,
  landing_page_id  UUID        REFERENCES landing_pages(id) ON DELETE SET NULL,
  lead_name        TEXT,
  lead_email       TEXT,
  lead_phone       TEXT,
  origin           TEXT        NOT NULL
                               CHECK (origin IN (
                                 'buyer_guide',
                                 'seller_guide',
                                 'contact_form',
                                 'whatsapp',
                                 'sms',
                                 'email',
                                 'other'
                               )),
  message          TEXT,
  status           TEXT        NOT NULL DEFAULT 'new'
                               CHECK (status IN ('new', 'contacted', 'converted', 'lost')),
  metadata         JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_realtor_leads_client  ON realtor_leads(client_id);
CREATE INDEX idx_realtor_leads_page    ON realtor_leads(landing_page_id);
CREATE INDEX idx_realtor_leads_created ON realtor_leads(created_at DESC);
CREATE INDEX idx_realtor_leads_status  ON realtor_leads(status);

COMMENT ON TABLE realtor_leads IS 'Contatos gerados pelas landing pages dos corretores. Base para o CRM LUMI FLOW.';


-- ─────────────────────────────────────────────────────────────
-- 7. LUMI_PROSPECTS — Interessados na plataforma LUMI
--    (Sistema da LUMI — separado dos leads dos corretores)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE lumi_prospects (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT,
  email       TEXT        NOT NULL,
  phone       TEXT,
  country     TEXT,
  origin      TEXT        NOT NULL
                          CHECK (origin IN (
                            'leadmagnet',
                            'newsletter',
                            'contact_form',
                            'other'
                          )),
  status      TEXT        NOT NULL DEFAULT 'new'
                          CHECK (status IN ('new', 'contacted', 'converted')),
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lumi_prospects_email   ON lumi_prospects(email);
CREATE INDEX idx_lumi_prospects_created ON lumi_prospects(created_at DESC);
CREATE INDEX idx_lumi_prospects_origin  ON lumi_prospects(origin);

COMMENT ON TABLE lumi_prospects IS 'Pessoas interessadas no produto LUMI. Lista de marketing da LUMI IDEA.';


-- ═══════════════════════════════════════════════════════════════
-- Row Level Security
-- As tabelas são acessadas via service_role key no backend,
-- então RLS pode ficar desabilitado. Habilitar futuramente
-- se o frontend acessar o Supabase diretamente.
-- ═══════════════════════════════════════════════════════════════
-- ALTER TABLE lumi_clients ENABLE ROW LEVEL SECURITY;
-- (Deixar comentado por enquanto — acesso via API server-side)
