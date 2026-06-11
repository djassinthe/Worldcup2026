-- ════════════════════════════════════════════════════════════════════════════
--  Worldcup2026 — Insertion des matchs (phase de groupes) — LOT 01
--  À exécuter dans Supabase → SQL Editor → Run.
--
--  • Fuseau : heures en heure de l'Est (America/Toronto), offset -04:00 (EDT, juin).
--  • Noms d'équipes alignés sur src/utils/bracketData.ts (GROUP_TEAMS).
--  • Drapeaux repris de la base pour cohérence avec le bracket et le classement.
--  • Idempotent : ré-exécutable sans créer de doublons
--    (clé logique = team_home + team_away + kickoff_at).
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO matches (phase, group_name, team_home, team_away, flag_home, flag_away, kickoff_at, venue)
SELECT v.phase, v.group_name, v.team_home, v.team_away, v.flag_home, v.flag_away, v.kickoff_at::timestamptz, v.venue
FROM (VALUES
  ('groupes','A','Mexique',        'Afrique du Sud',     '🇲🇽','🇿🇦','2026-06-11 15:00:00-04','Stade de Mexico'),
  ('groupes','A','Corée du Sud',   'Tchéquie',           '🇰🇷','🇨🇿','2026-06-11 22:00:00-04','Stade de Guadalajara'),
  ('groupes','B','Canada',         'Bosnie-Herzégovine', '🇨🇦','🇧🇦','2026-06-12 15:00:00-04','Stade de Toronto'),
  ('groupes','D','États-Unis',     'Paraguay',           '🇺🇸','🇵🇾','2026-06-12 18:00:00-04','Stade de Los Angeles'),
  ('groupes','B','Qatar',          'Suisse',             '🇶🇦','🇨🇭','2026-06-13 15:00:00-04','Stade de la baie de San Francisco'),
  ('groupes','C','Brésil',         'Maroc',              '🇧🇷','🇲🇦','2026-06-13 18:00:00-04','Stade de New York'),
  ('groupes','C','Haïti',          'Écosse',             '🇭🇹','🏴󠁧󠁢󠁳󠁣󠁴󠁿','2026-06-13 21:00:00-04','Stade de Boston'),
  ('groupes','D','Australie',      'Turquie',            '🇦🇺','🇹🇷','2026-06-14 00:00:00-04','BC Place de Vancouver'),
  ('groupes','E','Allemagne',      'Curaçao',            '🇩🇪','🇨🇼','2026-06-14 13:00:00-04','Stade de Houston'),
  ('groupes','F','Pays-Bas',       'Japon',              '🇳🇱','🇯🇵','2026-06-14 16:00:00-04','Stade de Dallas'),
  ('groupes','E','Côte d''Ivoire', 'Équateur',           '🇨🇮','🇪🇨','2026-06-14 19:00:00-04','Stade de Philadelphie'),
  ('groupes','F','Suède',          'Tunisie',            '🇸🇪','🇹🇳','2026-06-14 22:00:00-04','Stade de Monterrey')
) AS v(phase, group_name, team_home, team_away, flag_home, flag_away, kickoff_at, venue)
WHERE NOT EXISTS (
  SELECT 1 FROM matches m
  WHERE m.team_home = v.team_home
    AND m.team_away = v.team_away
    AND m.kickoff_at = v.kickoff_at::timestamptz
);

-- Vérification rapide
SELECT group_name, team_home, team_away, kickoff_at, venue
FROM matches
WHERE phase = 'groupes'
ORDER BY kickoff_at;
