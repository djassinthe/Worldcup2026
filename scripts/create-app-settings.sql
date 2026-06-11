-- ============================================================
-- WORLDCUP 2026 — Paramètres de l'application (verrouillage des brackets)
-- À coller dans Supabase → SQL Editor → New Query, puis Run.
-- ============================================================

-- Table à ligne unique (id = 1) contenant les réglages globaux.
CREATE TABLE IF NOT EXISTS app_settings (
  id              INT PRIMARY KEY DEFAULT 1,
  brackets_locked BOOLEAN NOT NULL DEFAULT FALSE,
  locked_at       TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT app_settings_single_row CHECK (id = 1)
);

-- Crée la ligne unique si elle n'existe pas encore.
INSERT INTO app_settings (id, brackets_locked)
VALUES (1, FALSE)
ON CONFLICT (id) DO NOTHING;

-- RLS : lecture pour tous, écriture autorisée (modifs faites depuis l'admin).
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_settings_select" ON app_settings;
CREATE POLICY "app_settings_select" ON app_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "app_settings_update" ON app_settings;
CREATE POLICY "app_settings_update" ON app_settings FOR UPDATE USING (true);

DROP POLICY IF EXISTS "app_settings_insert" ON app_settings;
CREATE POLICY "app_settings_insert" ON app_settings FOR INSERT WITH CHECK (true);
