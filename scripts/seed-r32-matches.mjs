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
  // M73 — 28 juin
  { team_home:'???', flag_home:'🏳️', team_away:'???', flag_away:'🏳️', kickoff_at:'2026-06-28T19:00:00Z', venue:'Los Angeles' },      // slot: 2e Groupe A  vs  2e Groupe B
  // M76 — 29 juin
  { team_home:'???', flag_home:'🏳️', team_away:'???', flag_away:'🏳️', kickoff_at:'2026-06-29T17:00:00Z', venue:'Houston' },          // slot: 1er Groupe C  vs  2e Groupe F
  // M74 — 29 juin
  { team_home:'???', flag_home:'🏳️', team_away:'???', flag_away:'🏳️', kickoff_at:'2026-06-29T20:30:00Z', venue:'Boston' },           // slot: 1er Groupe E  vs  3e (A/B/C/D/F)
  // M75 — 30 juin (00h locale 29 → 01:00Z 30)
  { team_home:'???', flag_home:'🏳️', team_away:'???', flag_away:'🏳️', kickoff_at:'2026-06-30T01:00:00Z', venue:'Monterrey' },        // slot: 1er Groupe F  vs  2e Groupe C
  // M78 — 30 juin
  { team_home:'???', flag_home:'🏳️', team_away:'???', flag_away:'🏳️', kickoff_at:'2026-06-30T17:00:00Z', venue:'Dallas' },           // slot: 2e Groupe E  vs  2e Groupe I
  // M77 — 30 juin
  { team_home:'???', flag_home:'🏳️', team_away:'???', flag_away:'🏳️', kickoff_at:'2026-06-30T21:00:00Z', venue:'New York/NJ' },      // slot: 1er Groupe I  vs  3e (C/D/F/G/H)
  // M79 — 1er juillet (19h locale 30 → 01:00Z 1er)
  { team_home:'???', flag_home:'🏳️', team_away:'???', flag_away:'🏳️', kickoff_at:'2026-07-01T01:00:00Z', venue:'Mexico City' },      // slot: 1er Groupe A  vs  3e (C/E/F/H/I)
  // M80 — 1er juillet
  { team_home:'???', flag_home:'🏳️', team_away:'???', flag_away:'🏳️', kickoff_at:'2026-07-01T16:00:00Z', venue:'Atlanta' },          // slot: 1er Groupe L  vs  3e (E/H/I/J/K)
  // M82 — 1er juillet
  { team_home:'???', flag_home:'🏳️', team_away:'???', flag_away:'🏳️', kickoff_at:'2026-07-01T20:00:00Z', venue:'Seattle' },          // slot: 1er Groupe G  vs  3e (A/E/H/I/J)
  // M81 — 2 juillet (17h locale 1er → 00:00Z 2)
  { team_home:'???', flag_home:'🏳️', team_away:'???', flag_away:'🏳️', kickoff_at:'2026-07-02T00:00:00Z', venue:'San Francisco' },    // slot: 1er Groupe D  vs  3e (B/E/F/I/J)
  // M84 — 2 juillet
  { team_home:'???', flag_home:'🏳️', team_away:'???', flag_away:'🏳️', kickoff_at:'2026-07-02T19:00:00Z', venue:'Los Angeles' },      // slot: 1er Groupe H  vs  2e Groupe J
  // M83 — 2 juillet
  { team_home:'???', flag_home:'🏳️', team_away:'???', flag_away:'🏳️', kickoff_at:'2026-07-02T23:00:00Z', venue:'Toronto' },          // slot: 2e Groupe K  vs  2e Groupe L
  // M85 — 3 juillet (20h locale 2 → 03:00Z 3)
  { team_home:'???', flag_home:'🏳️', team_away:'???', flag_away:'🏳️', kickoff_at:'2026-07-03T03:00:00Z', venue:'Vancouver' },        // slot: 1er Groupe B  vs  3e (E/F/G/I/J)
  // M88 — 3 juillet
  { team_home:'???', flag_home:'🏳️', team_away:'???', flag_away:'🏳️', kickoff_at:'2026-07-03T18:00:00Z', venue:'Dallas' },           // slot: 2e Groupe D  vs  2e Groupe G
  // M86 — 3 juillet
  { team_home:'???', flag_home:'🏳️', team_away:'???', flag_away:'🏳️', kickoff_at:'2026-07-03T22:00:00Z', venue:'Miami' },            // slot: 1er Groupe J  vs  2e Groupe H
  // M87 — 4 juillet (20h30 locale 3 → 01:30Z 4)
  { team_home:'???', flag_home:'🏳️', team_away:'???', flag_away:'🏳️', kickoff_at:'2026-07-04T01:30:00Z', venue:'Kansas City' },      // slot: 1er Groupe K  vs  3e (D/E/I/J/L)
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
