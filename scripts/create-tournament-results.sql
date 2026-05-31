-- Table pour les résultats officiels du tournoi (une seule ligne)
CREATE TABLE IF NOT EXISTS tournament_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Ligne initiale avec valeurs par défaut
INSERT INTO tournament_results (data) VALUES (
  '{"groupQualified":{"A":[0,1],"B":[0,1],"C":[0,1],"D":[0,1],"E":[0,1],"F":[0,1],"G":[0,1],"H":[0,1],"I":[0,1],"J":[0,1],"K":[0,1],"L":[0,1]},"r16":[null,null,null,null,null,null,null,null],"quarters":[null,null,null,null],"semis":[null,null],"final":null,"thirdPlace":null}'::jsonb
);

-- RLS
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read tournament_results" ON tournament_results FOR SELECT USING (true);
CREATE POLICY "Public write tournament_results" ON tournament_results FOR ALL USING (true);
