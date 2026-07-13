-- ════════════════════════════════════════════════════════════════════════════
--  DEMI-FINALES (M101 à M102)
--  Coupe du Monde 2026 — dates / heures (UTC) / lieux officiels FIFA
--  À exécuter dans l'éditeur SQL de Supabase.
-- ════════════════════════════════════════════════════════════════════════════
--
--  ⚠️  IMPORTANT — vérifie les affiches avant d'exécuter
--  Affiches dérivées des vainqueurs OFFICIELS des quarts (validés sur Wikipédia) :
--    M97  France 2–0 Maroc          → France
--    M98  Espagne 2–1 Belgique      → Espagne
--    M99  Norvège 1–2 Angleterre    → Angleterre
--    M100 Argentine 3–1 Suisse      → Argentine
--
--  Bracket → demi-finales :
--    M101 = W97 vs W98   →  France      vs Espagne
--    M102 = W99 vs W100  →  Angleterre  vs Argentine
--
--  Le classement relie chaque demie au bracket PAR LE NOM DES ÉQUIPES : les noms
--  doivent correspondre EXACTEMENT aux vainqueurs des quarts que tu as saisis.
--  Si un résultat de ton tournoi diffère, corrige team_home/team_away/flags.
--  (Noms et drapeaux valides = ceux de GROUP_TEAMS dans src/utils/bracketData.ts.)
--
--  Idempotent : relancer ce script n'insère pas de doublon (contrôle par paire d'équipes).
-- ════════════════════════════════════════════════════════════════════════════

WITH demis(team_home, flag_home, team_away, flag_away, kickoff_at, venue) AS (
  VALUES
    -- M101 — 14 juillet, Arlington (AT&T Stadium)
    ('France',     '🇫🇷', 'Espagne',   '🇪🇸', TIMESTAMPTZ '2026-07-14 19:00:00+00', 'Arlington'),
    -- M102 — 15 juillet, Atlanta (Mercedes-Benz Stadium)
    ('Angleterre', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Argentine', '🇦🇷', TIMESTAMPTZ '2026-07-15 19:00:00+00', 'Atlanta')
)
INSERT INTO matches
  (phase, group_name, team_home, team_away, flag_home, flag_away,
   score_home, score_away, pen_home, pen_away, kickoff_at, is_locked, venue)
SELECT
  'demis', NULL, demis.team_home, demis.team_away, demis.flag_home, demis.flag_away,
  NULL, NULL, NULL, NULL, demis.kickoff_at, false, demis.venue
FROM demis
WHERE NOT EXISTS (
  -- ne réinsère pas une demie déjà présente (peu importe l'ordre des équipes)
  SELECT 1 FROM matches m
  WHERE m.phase = 'demis'
    AND (
      (m.team_home = demis.team_home AND m.team_away = demis.team_away)
      OR
      (m.team_home = demis.team_away AND m.team_away = demis.team_home)
    )
);

-- Vérification : liste les demi-finales présentes, triées par date
SELECT kickoff_at, flag_home, team_home, team_away, flag_away, venue
FROM matches
WHERE phase = 'demis'
ORDER BY kickoff_at;
