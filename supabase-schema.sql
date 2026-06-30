-- ============================================================
-- WORLDCUP 2026 — Schéma Supabase
-- À coller dans SQL Editor > New Query dans ton dashboard Supabase
-- ============================================================

-- 1. Table des joueurs
CREATE TABLE IF NOT EXISTS players (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pseudo     TEXT NOT NULL UNIQUE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table des matchs
CREATE TABLE IF NOT EXISTS matches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase       TEXT NOT NULL CHECK (phase IN ('groupes','seiziemes','huitiemes','quarts','demis','finale')),
  group_name  TEXT,
  team_home   TEXT NOT NULL,
  team_away   TEXT NOT NULL,
  flag_home   TEXT NOT NULL DEFAULT '🏳',
  flag_away   TEXT NOT NULL DEFAULT '🏳',
  score_home  INTEGER,
  score_away  INTEGER,
  pen_home    INTEGER,
  pen_away    INTEGER,
  kickoff_at  TIMESTAMPTZ NOT NULL,
  is_locked   BOOLEAN NOT NULL DEFAULT FALSE,
  venue       TEXT
);

-- 3. Table des pronostics
CREATE TABLE IF NOT EXISTS predictions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id     UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  match_id      UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  pred_home     INTEGER NOT NULL CHECK (pred_home >= 0),
  pred_away     INTEGER NOT NULL CHECK (pred_away >= 0),
  points_earned INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(player_id, match_id)
);

-- 4. Index pour la performance
CREATE INDEX IF NOT EXISTS idx_predictions_player ON predictions(player_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match  ON predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_matches_phase      ON matches(phase);
CREATE INDEX IF NOT EXISTS idx_matches_kickoff    ON matches(kickoff_at);

-- 5. Fonction de classement (appelée avec supabase.rpc('get_leaderboard'))
CREATE OR REPLACE FUNCTION get_leaderboard()
RETURNS TABLE (
  player_id       UUID,
  pseudo          TEXT,
  total_points    BIGINT,
  correct_results BIGINT,
  exact_scores    BIGINT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    pl.id                                             AS player_id,
    pl.pseudo,
    COALESCE(SUM(pr.points_earned), 0)               AS total_points,
    COUNT(pr.id) FILTER (WHERE pr.points_earned > 0) AS correct_results,
    COUNT(pr.id) FILTER (
      WHERE pr.points_earned > 0
        AND pr.pred_home = m.score_home
        AND pr.pred_away = m.score_away
    )                                                  AS exact_scores
  FROM players pl
  LEFT JOIN predictions pr ON pr.player_id = pl.id
  LEFT JOIN matches m      ON m.id = pr.match_id
  GROUP BY pl.id, pl.pseudo
  ORDER BY total_points DESC, exact_scores DESC
$$;

-- 6. Politique RLS — activer Row Level Security
ALTER TABLE players    ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches    ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- players : tout le monde peut lire, chacun peut s'insérer/modifier
CREATE POLICY "players_select" ON players FOR SELECT USING (true);
CREATE POLICY "players_insert" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "players_update" ON players FOR UPDATE USING (true);

-- matches : tout le monde peut lire, personne ne peut modifier via le client
-- (les modifications se font via le service_role depuis le backend/admin)
CREATE POLICY "matches_select" ON matches FOR SELECT USING (true);
CREATE POLICY "matches_insert" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "matches_update" ON matches FOR UPDATE USING (true);
CREATE POLICY "matches_delete" ON matches FOR DELETE USING (true);

-- predictions : lecture globale, écriture seulement pour son propre player_id
CREATE POLICY "predictions_select" ON predictions FOR SELECT USING (true);
CREATE POLICY "predictions_insert" ON predictions FOR INSERT WITH CHECK (true);
CREATE POLICY "predictions_update" ON predictions FOR UPDATE USING (true);
