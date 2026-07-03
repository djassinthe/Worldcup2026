-- Instantanés (snapshots) du classement pour calculer la vraie tendance
-- (flèches vertes/rouges) entre deux mises à jour de résultats.
-- Un "batch" = toutes les lignes partageant le même snapshot_at.

CREATE TABLE IF NOT EXISTS rank_snapshots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_at timestamptz NOT NULL DEFAULT now(),
  player_id   uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  rank        integer NOT NULL,
  points      integer NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rank_snapshots_at ON rank_snapshots(snapshot_at DESC);

-- RLS : lecture publique, insertion publique (l'admin écrit via le client)
ALTER TABLE rank_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rank_snapshots_select" ON rank_snapshots;
CREATE POLICY "rank_snapshots_select" ON rank_snapshots FOR SELECT USING (true);

DROP POLICY IF EXISTS "rank_snapshots_insert" ON rank_snapshots;
CREATE POLICY "rank_snapshots_insert" ON rank_snapshots FOR INSERT WITH CHECK (true);
