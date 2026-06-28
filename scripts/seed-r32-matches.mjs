/**
 * Script d'insertion des 16 matchs des SEIZIÈMES DE FINALE (Round of 32)
 * Coupe du Monde 2026 — dates/heures/lieux officiels FIFA (vérifiés 24 juin 2026)
 * Source : https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage
 *
 * ⚠️ À COMPLÉTER DIMANCHE 28 JUIN une fois la phase de groupes terminée :
 *   Remplacer chaque `team_home`/`team_away` (et flag) « ??? » par l'équipe réelle
 *   correspondant au libellé indiqué dans le commentaire `// slot`.
 *
 * Usage :
 *   VITE_SUPABASE_URL=https://xxx.supabase.co \
 *   VITE_SUPABASE_ANON_KEY=eyJ... \
 *   node scripts/seed-r32-matches.mjs
 *
 * Pour un essai à blanc (n'insère rien, affiche le payload) :
 *   DRY_RUN=1 node scripts/seed-r32-matches.mjs
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY
const DRY_RUN = process.env.DRY_RUN === '1'

if (!DRY_RUN && (!SUPABASE_URL || !SUPABASE_KEY)) {
  console.error('❌ Variables manquantes. Lancer avec :')
  console.error('   VITE_SUPABASE_URL=https://xxx.supabase.co VITE_SUPABASE_ANON_KEY=eyJ... node scripts/seed-r32-matches.mjs')
  process.exit(1)
}

// ─── Les 16 seizièmes (Matchs 73 à 88) ───────────────────────────────────────
// kickoff_at en UTC. Ordre chronologique officiel FIFA.
// Le champ `slot` (commentaire) rappelle quelle équipe va dans chaque case.
const matches = [
  // M73 — 28 juin — 2e A vs 2e B
  { team_home:'Afrique du Sud', flag_home:'🇿🇦', team_away:'Canada',     flag_away:'🇨🇦', kickoff_at:'2026-06-28T19:00:00Z', venue:'Los Angeles' },
  // M76 — 29 juin — 1er C vs 2e F
  { team_home:'Brésil',         flag_home:'🇧🇷', team_away:'Japon',      flag_away:'🇯🇵', kickoff_at:'2026-06-29T17:00:00Z', venue:'Houston' },
  // M74 — 29 juin — 1er E vs 3e (A/B/C/D/F)
  { team_home:'Allemagne',      flag_home:'🇩🇪', team_away:'Paraguay',   flag_away:'🇵🇾', kickoff_at:'2026-06-29T20:30:00Z', venue:'Boston' },
  // M75 — 30 juin — 1er F vs 2e C
  { team_home:'Pays-Bas',       flag_home:'🇳🇱', team_away:'Maroc',      flag_away:'🇲🇦', kickoff_at:'2026-06-30T01:00:00Z', venue:'Monterrey' },
  // M78 — 30 juin — 2e E vs 2e I
  { team_home:"Côte d'Ivoire",  flag_home:'🇨🇮', team_away:'Norvège',    flag_away:'🇳🇴', kickoff_at:'2026-06-30T17:00:00Z', venue:'Dallas' },
  // M77 — 30 juin — 1er I vs 3e (C/D/F/G/H)
  { team_home:'France',         flag_home:'🇫🇷', team_away:'Suède',      flag_away:'🇸🇪', kickoff_at:'2026-06-30T21:00:00Z', venue:'New York/NJ' },
  // M79 — 1er juillet — 1er A vs 3e (C/E/F/H/I)
  { team_home:'Mexique',        flag_home:'🇲🇽', team_away:'Équateur',   flag_away:'🇪🇨', kickoff_at:'2026-07-01T01:00:00Z', venue:'Mexico City' },
  // M80 — 1er juillet — 1er L vs 3e (E/H/I/J/K)
  { team_home:'Angleterre',     flag_home:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', team_away:'RD Congo',   flag_away:'🇨🇩', kickoff_at:'2026-07-01T16:00:00Z', venue:'Atlanta' },
  // M82 — 1er juillet — 1er G vs 3e (A/E/H/I/J)
  { team_home:'Belgique',       flag_home:'🇧🇪', team_away:'Sénégal',    flag_away:'🇸🇳', kickoff_at:'2026-07-01T20:00:00Z', venue:'Seattle' },
  // M81 — 2 juillet — 1er D vs 3e (B/E/F/I/J)
  { team_home:'États-Unis',     flag_home:'🇺🇸', team_away:'Bosnie-Herzégovine', flag_away:'🇧🇦', kickoff_at:'2026-07-02T00:00:00Z', venue:'San Francisco' },
  // M84 — 2 juillet — 1er H vs 2e J
  { team_home:'Espagne',        flag_home:'🇪🇸', team_away:'Autriche',   flag_away:'🇦🇹', kickoff_at:'2026-07-02T19:00:00Z', venue:'Los Angeles' },
  // M83 — 2 juillet — 2e K vs 2e L
  { team_home:'Portugal',       flag_home:'🇵🇹', team_away:'Croatie',    flag_away:'🇭🇷', kickoff_at:'2026-07-02T23:00:00Z', venue:'Toronto' },
  // M85 — 3 juillet — 1er B vs 3e (E/F/G/I/J)
  { team_home:'Suisse',         flag_home:'🇨🇭', team_away:'Algérie',    flag_away:'🇩🇿', kickoff_at:'2026-07-03T03:00:00Z', venue:'Vancouver' },
  // M88 — 3 juillet — 2e D vs 2e G
  { team_home:'Australie',      flag_home:'🇦🇺', team_away:'Égypte',     flag_away:'🇪🇬', kickoff_at:'2026-07-03T18:00:00Z', venue:'Dallas' },
  // M86 — 3 juillet — 1er J vs 2e H
  { team_home:'Argentine',      flag_home:'🇦🇷', team_away:'Cap-Vert',   flag_away:'🇨🇻', kickoff_at:'2026-07-03T22:00:00Z', venue:'Miami' },
  // M87 — 4 juillet — 1er K vs 3e (D/E/I/J/L)
  { team_home:'Colombie',       flag_home:'🇨🇴', team_away:'Ghana',      flag_away:'🇬🇭', kickoff_at:'2026-07-04T01:30:00Z', venue:'Kansas City' },
]

// Sécurité : ne pas insérer tant que les équipes ne sont pas remplies
const incomplete = matches.filter(m => m.team_home === '???' || m.team_away === '???')
if (!DRY_RUN && incomplete.length > 0) {
  console.error(`❌ ${incomplete.length} match(s) ont encore « ??? » comme équipe.`)
  console.error('   Complète les noms/flags avant de lancer (ou utilise DRY_RUN=1 pour tester).')
  process.exit(1)
}

const payload = matches.map(m => ({
  phase: 'seiziemes',
  group_name: null,
  team_home: m.team_home,
  team_away: m.team_away,
  flag_home: m.flag_home,
  flag_away: m.flag_away,
  kickoff_at: m.kickoff_at,
  venue: m.venue,
  is_locked: false,
  score_home: null,
  score_away: null,
}))

if (DRY_RUN) {
  console.log('🧪 DRY_RUN — aucun appel réseau. Payload qui serait inséré :')
  console.log(JSON.stringify(payload, null, 2))
  process.exit(0)
}

console.log(`📦 Insertion de ${payload.length} seizièmes de finale...`)

const res = await fetch(`${SUPABASE_URL}/rest/v1/matches`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Prefer': 'return=minimal',
  },
  body: JSON.stringify(payload),
})

if (res.ok) {
  console.log(`✅ ${payload.length} seizièmes insérés avec succès !`)
} else {
  const err = await res.text()
  console.error('❌ Erreur:', res.status, err)
  process.exit(1)
}
