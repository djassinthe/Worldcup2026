-- Ajout du support des tirs au but (t.a.b.) pour les matchs à élimination directe.
-- pen_home / pen_away = nombre de tirs au but réussis par chaque équipe.
-- Restent NULL pour les matchs sans séance de tirs au but.

ALTER TABLE matches ADD COLUMN IF NOT EXISTS pen_home INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS pen_away INTEGER;
