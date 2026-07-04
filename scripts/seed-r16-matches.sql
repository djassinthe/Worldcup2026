-- ════════════════════════════════════════════════════════════════════════════
--  HUITIÈMES DE FINALE (Round of 16 — M89 à M96)
--  Coupe du Monde 2026 — dates / heures (UTC) / lieux officiels FIFA
--  À exécuter dans l'éditeur SQL de Supabase.
-- ════════════════════════════════════════════════════════════════════════════
--
--  ⚠️  IMPORTANT — vérifie les affiches avant d'exécuter
--  Les équipes ci-dessous sont les affiches OFFICIELLES de la vraie Coupe du Monde.
--  Le classement relie chaque huitième au bracket PAR LE NOM DES ÉQUIPES : les noms
--  doivent donc correspondre EXACTEMENT aux vainqueurs des seizièmes que tu as saisis.
--  Si un résultat de ton tournoi diffère de la réalité, corrige simplement le
--  team_home / team_away / flag_home / flag_away de la ligne concernée.
--  (Noms et drapeaux valides = ceux de GROUP_TEAMS dans src/utils/bracketData.ts.)
--
--  Idempotent : relancer ce script n'insère pas de doublon (contrôle par paire d'équipes).
-- ════════════════════════════════════════════════════════════════════════════

WITH r16(team_home, flag_home, team_away, flag_away, kickoff_at, venue) AS (
  VALUES
    -- M90 — 4 juillet, Houston
    ('Canada',      '🇨🇦', 'Maroc',      '🇲🇦', TIMESTAMPTZ '2026-07-04 17:00:00+00', 'Houston'),
    -- M89 — 4 juillet, Philadelphie
    ('Paraguay',    '🇵🇾', 'France',     '🇫🇷', TIMESTAMPTZ '2026-07-04 21:00:00+00', 'Philadelphie'),
    -- M91 — 5 juillet, New York/NJ
    ('Brésil',      '🇧🇷', 'Norvège',    '🇳🇴', TIMESTAMPTZ '2026-07-05 20:00:00+00', 'New York/NJ'),
    -- M92 — 6 juillet (00:00 UTC), Mexico
    ('Mexique',     '🇲🇽', 'Angleterre', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', TIMESTAMPTZ '2026-07-06 00:00:00+00', 'Mexico'),
    -- M93 — 6 juillet, Dallas
    ('Portugal',    '🇵🇹', 'Espagne',    '🇪🇸', TIMESTAMPTZ '2026-07-06 19:00:00+00', 'Dallas'),
    -- M94 — 7 juillet (00:00 UTC), Seattle
    ('États-Unis',  '🇺🇸', 'Belgique',   '🇧🇪', TIMESTAMPTZ '2026-07-07 00:00:00+00', 'Seattle'),
    -- M95 — 7 juillet, Atlanta
    ('Argentine',   '🇦🇷', 'Égypte',     '🇪🇬', TIMESTAMPTZ '2026-07-07 16:00:00+00', 'Atlanta'),
    -- M96 — 7 juillet, Vancouver
    ('Suisse',      '🇨🇭', 'Colombie',   '🇨🇴', TIMESTAMPTZ '2026-07-07 20:00:00+00', 'Vancouver')
)
INSERT INTO matches
  (phase, group_name, team_home, team_away, flag_home, flag_away,
   score_home, score_away, pen_home, pen_away, kickoff_at, is_locked, venue)
SELECT
  'huitiemes', NULL, r16.team_home, r16.team_away, r16.flag_home, r16.flag_away,
  NULL, NULL, NULL, NULL, r16.kickoff_at, false, r16.venue
FROM r16
WHERE NOT EXISTS (
  -- ne réinsère pas un huitième déjà présent (peu importe l'ordre des équipes)
  SELECT 1 FROM matches m
  WHERE m.phase = 'huitiemes'
    AND (
      (m.team_home = r16.team_home AND m.team_away = r16.team_away)
      OR
      (m.team_home = r16.team_away AND m.team_away = r16.team_home)
    )
);

-- Vérification : liste les huitièmes présents, triés par date
SELECT kickoff_at, flag_home, team_home, team_away, flag_away, venue
FROM matches
WHERE phase = 'huitiemes'
ORDER BY kickoff_at;
