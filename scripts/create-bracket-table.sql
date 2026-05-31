-- Table des pronostics bracket (un par joueur)
CREATE TABLE IF NOT EXISTS bracket_predictions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id  UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  data       JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (player_id)
);

ALTER TABLE bracket_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bracket_select_all" ON bracket_predictions
  FOR SELECT USING (true);

CREATE POLICY "bracket_insert_all" ON bracket_predictions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "bracket_update_all" ON bracket_predictions
  FOR UPDATE USING (true);
