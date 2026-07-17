-- ════════════════════════════════════════════════════════════════════════════
--  PETITE FINALE + GRANDE FINALE (M103 à M104)
--  Coupe du Monde 2026 — dates / heures (UTC) / lieux officiels FIFA
--  À exécuter dans l'éditeur SQL de Supabase.
-- ════════════════════════════════════════════════════════════════════════════
--
--  ⚠️  IMPORTANT — vérifie les affiches avant d'exécuter
--  Affiches dérivées des résultats des demi-finales que tu as saisis :
--    M101 France 0–2 Espagne          → gagnant Espagne     / perdant France
--    M102 Angleterre 1–2 Argentine    → gagnant Argentine   / perdant Angleterre
--
--  Bracket → finales :
--    M103 (petite finale, 3e place) = perdant M101 vs perdant M102  →  France   vs Angleterre
--    M104 (grande finale)           = gagnant M101 vs gagnant M102  →  Espagne  vs Argentine
--
--  ⚠️  Les DEUX matchs utilisent phase = 'finale'.
--  Le classement les distingue automatiquement par les équipes :
--    • le match entre les deux VAINQUEURS de demies  = grande finale (champion, 25 pts)
--    • le match entre les deux PERDANTS  de demies    = petite finale (3e place, 10 pts)
--
--  Les noms doivent correspondre EXACTEMENT aux équipes des demies.
--  Si un résultat de ton tournoi diffère, corrige team_home/team_away/flags.
--  (Noms et drapeaux valides = ceux de GROUP_TEAMS dans src/utils/bracketData.ts.)
--
--  Idempotent : relancer ce script n'insère pas de doublon (contrôle par paire d'équipes).
-- ════════════════════════════════════════════════════════════════════════════

WITH finales(team_home, flag_home, team_away, flag_away, kickoff_at, venue) AS (
  VALUES
    -- M103 — Petite finale (3e place) — 18 juillet, Miami Gardens (Hard Rock Stadium)
    ('France',  '🇫🇷', 'Angleterre', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', TIMESTAMPTZ '2026-07-18 21:00:00+00', 'Miami Gardens'),
    -- M104 — Grande finale — 19 juillet, East Rutherford (MetLife Stadium)
    ('Espagne', '🇪🇸', 'Argentine',  '🇦🇷', TIMESTAMPTZ '2026-07-19 19:00:00+00', 'East Rutherford')
)
INSERT INTO matches
  (phase, group_name, team_home, team_away, flag_home, flag_away,
   score_home, score_away, pen_home, pen_away, kickoff_at, is_locked, venue)
SELECT
  'finale', NULL, finales.team_home, finales.team_away, finales.flag_home, finales.flag_away,
  NULL, NULL, NULL, NULL, finales.kickoff_at, false, finales.venue
FROM finales
WHERE NOT EXISTS (
  -- ne réinsère pas un match déjà présent (peu importe l'ordre des équipes)
  SELECT 1 FROM matches m
  WHERE m.phase = 'finale'
    AND (
      (m.team_home = finales.team_home AND m.team_away = finales.team_away)
      OR
      (m.team_home = finales.team_away AND m.team_away = finales.team_home)
    )
);

-- Vérification : liste les matchs de phase finale présents, triés par date
SELECT kickoff_at, flag_home, team_home, team_away, flag_away, venue
FROM matches
WHERE phase = 'finale'
ORDER BY kickoff_at;
