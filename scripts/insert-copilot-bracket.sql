-- ════════════════════════════════════════════════════════════════════════════
--  Worldcup2026 — Bracket de « 🤖 Copilot » (pour voir ce que ça donne)
--  À exécuter dans Supabase → SQL Editor → Run.
--
--  Crée (ou met à jour) un joueur "🤖 Copilot" et son pronostic complet.
--  Idempotent : ré-exécutable sans doublon (clé = pseudo, puis player_id).
--
--  Résumé du pronostic :
--   • Champion   : 🇪🇸 Espagne
--   • Finaliste  : 🇦🇷 Argentine
--   • 3e place   : 🇧🇷 Brésil   (4e : 🇫🇷 France)
--   • Demi-fin.  : France, Espagne, Brésil, Argentine
--   • Meilleurs 3es qualifiés : groupes A, C, D, E, G, I, J, L
-- ════════════════════════════════════════════════════════════════════════════

WITH upsert_player AS (
  INSERT INTO players (pseudo)
  VALUES ('🤖 Copilot')
  ON CONFLICT (pseudo) DO UPDATE SET pseudo = EXCLUDED.pseudo
  RETURNING id
)
INSERT INTO bracket_predictions (player_id, data, updated_at)
SELECT id, '{
  "groupQualified": {
    "A": [0, 2, 3],
    "B": [3, 0, 2],
    "C": [0, 1, 3],
    "D": [0, 3, 1],
    "E": [0, 3, 2],
    "F": [0, 1, 2],
    "G": [0, 1, 2],
    "H": [0, 3, 1],
    "I": [0, 1, 3],
    "J": [0, 2, 1],
    "K": [0, 3, 2],
    "L": [0, 1, 2]
  },
  "bestThirds": ["A", "C", "D", "E", "G", "I", "J", "L"],
  "r32": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  "r16": [1, 1, 1, 1, 0, 1, 0, 1],
  "quarters": [0, 0, 0, 0],
  "semis": [1, 1],
  "final": 0,
  "thirdPlace": 1
}'::jsonb, now()
FROM upsert_player
ON CONFLICT (player_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now();
