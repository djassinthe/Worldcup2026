/**
 * Prépare les HUITIÈMES DE FINALE (Round of 16 — matchs M89 à M96).
 * Coupe du Monde 2026 — dates/heures/lieux officiels FIFA.
 * Source : https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage
 *
 * Les ÉQUIPES sont dérivées automatiquement des vrais résultats des seizièmes
 * enregistrés dans la table `matches` (via buildOfficialResults). Aucune saisie
 * manuelle : les 16 seizièmes doivent simplement être tous joués (score saisi).
 *
 * Idempotent : ne réinsère pas un huitième déjà présent (comparaison par équipes).
 *
 * Usage :
 *   VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... npx -y tsx scripts/seed-r16-matches.ts
 * ou, si un fichier .env existe (mêmes variables que l'app) :
 *   npx -y tsx scripts/seed-r16-matches.ts
 *
 * Essai à blanc (n'insère rien, affiche les affiches dérivées) :
 *   DRY_RUN=1 npx -y tsx scripts/seed-r16-matches.ts
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import type { Match } from '../src/types'
import { getR16Team } from '../src/utils/bracketData'
import { buildOfficialResults } from '../src/utils/officialResults'

// ── .env optionnel (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) ──────────────
function loadEnv() {
  try {
    const txt = readFileSync(new URL('../.env', import.meta.url), 'utf8')
    for (const line of txt.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch { /* pas de .env */ }
}
loadEnv()

const DRY_RUN = process.env.DRY_RUN === '1'
const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY
if (!DRY_RUN && (!url || !key)) {
  console.error('❌ Variables manquantes. Fournis VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY (via .env ou en ligne de commande).')
  process.exit(1)
}

// ── Métadonnées officielles par slot R16 (index 0..7 de R16_PAIRS) ───────────
// kickoff_at en UTC. Le n° de match FIFA sert de repère chronologique.
const R16_META: { match: number; kickoff_at: string; venue: string }[] = [
  { match: 89, kickoff_at: '2026-07-04T21:00:00Z', venue: 'Philadelphie' },   // R16[0] W74 vs W77
  { match: 90, kickoff_at: '2026-07-04T17:00:00Z', venue: 'Houston' },        // R16[1] W73 vs W75
  { match: 93, kickoff_at: '2026-07-06T19:00:00Z', venue: 'Dallas' },         // R16[2] W83 vs W84
  { match: 94, kickoff_at: '2026-07-07T00:00:00Z', venue: 'Seattle' },        // R16[3] W81 vs W82
  { match: 91, kickoff_at: '2026-07-05T20:00:00Z', venue: 'New York/NJ' },    // R16[4] W76 vs W78
  { match: 92, kickoff_at: '2026-07-06T00:00:00Z', venue: 'Mexico City' },    // R16[5] W79 vs W80
  { match: 95, kickoff_at: '2026-07-07T16:00:00Z', venue: 'Atlanta' },        // R16[6] W86 vs W88
  { match: 96, kickoff_at: '2026-07-07T20:00:00Z', venue: 'Vancouver' },      // R16[7] W85 vs W87
]

function pairKey(a: string, b: string): string {
  return [a, b].sort().join(' :: ')
}

async function main() {
  const supabase = createClient(url ?? 'http://localhost', key ?? 'dry-run')

  const { data: matchData, error } = DRY_RUN
    ? { data: [], error: null }
    : await supabase.from('matches').select('*')
  if (error) throw error
  const matches = (matchData ?? []) as Match[]

  const { data: real } = buildOfficialResults(matches)

  // Affiches des huitièmes dérivées des vainqueurs réels des seizièmes
  const rows: {
    phase: string; group_name: null; team_home: string; team_away: string
    flag_home: string; flag_away: string; kickoff_at: string; venue: string
    is_locked: boolean; score_home: null; score_away: null; pen_home: null; pen_away: null
  }[] = []
  const missing: number[] = []

  for (let i = 0; i < 8; i++) {
    const t0 = getR16Team(real, i, 0)
    const t1 = getR16Team(real, i, 1)
    const meta = R16_META[i]
    if (!t0 || !t1) { missing.push(meta.match); continue }
    rows.push({
      phase: 'huitiemes',
      group_name: null,
      team_home: t0.name,
      team_away: t1.name,
      flag_home: t0.flag,
      flag_away: t1.flag,
      kickoff_at: meta.kickoff_at,
      venue: meta.venue,
      is_locked: false,
      score_home: null,
      score_away: null,
      pen_home: null,
      pen_away: null,
    })
  }

  // Tri chronologique pour un affichage lisible
  rows.sort((a, b) => a.kickoff_at.localeCompare(b.kickoff_at))

  console.log('\n═══ HUITIÈMES DÉRIVÉS DES RÉSULTATS DES SEIZIÈMES ═══')
  for (const r of rows) {
    console.log(`${r.kickoff_at}  ${r.flag_home} ${r.team_home.padEnd(20)} vs ${r.team_away.padEnd(20)} ${r.flag_away}  (${r.venue})`)
  }
  if (missing.length) {
    console.warn(`\n⚠️  ${missing.length} huitième(s) indéterminé(s) (seizièmes non tous joués) : M${missing.join(', M')}`)
  }

  if (DRY_RUN) {
    console.log('\n🧪 DRY_RUN — aucun appel réseau.')
    process.exit(0)
  }

  if (rows.length === 0) {
    console.error('\n❌ Aucun huitième dérivable. Vérifie que les 16 seizièmes ont bien un score.')
    process.exit(1)
  }

  // Idempotence : ne pas réinsérer un huitième déjà présent (par paire d'équipes)
  const existing = new Set(
    matches.filter(m => m.phase === 'huitiemes').map(m => pairKey(m.team_home, m.team_away)),
  )
  const toInsert = rows.filter(r => !existing.has(pairKey(r.team_home, r.team_away)))

  if (toInsert.length === 0) {
    console.log('\n✅ Tous les huitièmes dérivés existent déjà. Rien à insérer.')
    process.exit(0)
  }

  console.log(`\n📦 Insertion de ${toInsert.length} huitième(s)...`)
  const { error: insErr } = await supabase.from('matches').insert(toInsert)
  if (insErr) {
    console.error('❌ Erreur:', insErr.message)
    process.exit(1)
  }
  console.log(`✅ ${toInsert.length} huitième(s) inséré(s) avec succès !`)
}

main().catch(e => { console.error(e); process.exit(1) })
