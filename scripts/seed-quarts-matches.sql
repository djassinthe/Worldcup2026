-- ════════════════════════════════════════════════════════════════════════════
--  QUARTS DE FINALE (M97 à M100)
--  Coupe du Monde 2026 — dates / heures (UTC) / lieux officiels FIFA
--  À exécuter dans l'éditeur SQL de Supabase.
-- ════════════════════════════════════════════════════════════════════════════
--
--  ⚠️  IMPORTANT — vérifie les affiches avant d'exécuter
--  Affiches dérivées des vainqueurs OFFICIELS des huitièmes (validés sur Wikipédia) :
--    M89 Paraguay 0–1 France            → France
--    M90 Canada 0–3 Maroc               → Maroc
--    M91 Brésil 1–2 Norvège             → Norvège
--    M92 Mexique 2–3 Angleterre         → Angleterre
--    M93 Portugal 0–1 Espagne           → Espagne
--    M94 États-Unis 1–4 Belgique        → Belgique
--    M95 Argentine 3–2 Égypte           → Argentine
--    M96 Suisse 0–0 (4–3 t.a.b.) Colombie → Suisse
--
--  Bracket → quarts :
--    M97 = W89 vs W90  →  France     vs Maroc
--    M98 = W93 vs W94  →  Espagne    vs Belgique
--    M99 = W91 vs W92  →  Norvège    vs Angleterre
--    M100 = W95 vs W96 →  Argentine  vs Suisse
--
--  Le classement relie chaque quart au bracket PAR LE NOM DES ÉQUIPES : les noms
--  doivent correspondre EXACTEMENT aux vainqueurs des huitièmes que tu as saisis.
--  Si un résultat de ton tournoi diffère, corrige team_home/team_away/flags.
--  (Noms et drapeaux valides = ceux de GROUP_TEAMS dans src/utils/bracketData.ts.)
--
--  Idempotent : relancer ce script n'insère pas de doublon (contrôle par paire d'équipes).
-- ════════════════════════════════════════════════════════════════════════════

WITH quarts(team_home, flag_home, team_away, flag_away, kickoff_at, venue) AS (
  VALUES
    -- M97 — 9 juillet, Foxborough
    ('France',    '🇫🇷', 'Maroc',      '🇲🇦', TIMESTAMPTZ '2026-07-09 20:00:00+00', 'Foxborough'),
    -- M98 — 10 juillet, Los Angeles
    ('Espagne',   '🇪🇸', 'Belgique',   '🇧🇪', TIMESTAMPTZ '2026-07-10 19:00:00+00', 'Los Angeles'),
    -- M99 — 11 juillet, Miami
    ('Norvège',   '🇳🇴', 'Angleterre', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', TIMESTAMPTZ '2026-07-11 21:00:00+00', 'Miami'),
    -- M100 — 12 juillet (01:00 UTC), Kansas City
    ('Argentine', '🇦🇷', 'Suisse',     '🇨🇭', TIMESTAMPTZ '2026-07-12 01:00:00+00', 'Kansas City')
)
INSERT INTO matches
  (phase, group_name, team_home, team_away, flag_home, flag_away,
   score_home, score_away, pen_home, pen_away, kickoff_at, is_locked, venue)
SELECT
  'quarts', NULL, quarts.team_home, quarts.team_away, quarts.flag_home, quarts.flag_away,
  NULL, NULL, NULL, NULL, quarts.kickoff_at, false, quarts.venue
FROM quarts
WHERE NOT EXISTS (
  -- ne réinsère pas un quart déjà présent (peu importe l'ordre des équipes)
  SELECT 1 FROM matches m
  WHERE m.phase = 'quarts'
    AND (
      (m.team_home = quarts.team_home AND m.team_away = quarts.team_away)
      OR
      (m.team_home = quarts.team_away AND m.team_away = quarts.team_home)
    )
);

-- Vérification : liste les quarts présents, triés par date
SELECT kickoff_at, flag_home, team_home, team_away, flag_away, venue
FROM matches
WHERE phase = 'quarts'
ORDER BY kickoff_at;
