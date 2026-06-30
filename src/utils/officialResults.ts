import type { Match } from '../types'
import { computeGroupStandings } from './groupStandings'
import {
  DEFAULT_DATA,
  GROUP_TEAMS,
  getR32Team,
  getR16Team,
  getQuarterTeam,
  getSemiTeam,
  getSemiWinner,
  getSemiLoser,
  type BracketData,
} from './bracketData'

// ════════════════════════════════════════════════════════════════════════════
//  officialResults — reconstruit le bracket "officiel" UNIQUEMENT à partir des
//  scores saisis dans la table `matches`. La progression (qui se qualifie) est
//  déduite des résultats : score, puis tirs au but en cas d'égalité.
//  → La table `matches` devient la seule source de vérité du classement.
// ════════════════════════════════════════════════════════════════════════════

function cloneDefault(): BracketData {
  return {
    groupQualified: { ...DEFAULT_DATA.groupQualified },
    bestThirds: [],
    r32: [...DEFAULT_DATA.r32],
    r16: [...DEFAULT_DATA.r16],
    quarters: [...DEFAULT_DATA.quarters],
    semis: [...DEFAULT_DATA.semis],
    final: DEFAULT_DATA.final,
    thirdPlace: DEFAULT_DATA.thirdPlace,
  }
}

// Nom de l'équipe gagnante d'un match (score, puis t.a.b. si nul). null si indéterminé.
function winnerName(m: Match): string | null {
  if (m.score_home == null || m.score_away == null) return null
  if (m.score_home > m.score_away) return m.team_home
  if (m.score_away > m.score_home) return m.team_away
  // Égalité → tirs au but
  if (m.pen_home != null && m.pen_away != null) {
    if (m.pen_home > m.pen_away) return m.team_home
    if (m.pen_away > m.pen_home) return m.team_away
  }
  return null
}

// Clé indépendante de l'ordre domicile/extérieur
function pairKey(a: string, b: string): string {
  return [a, b].sort().join(' :: ')
}

function indexByPair(matches: Match[], phase: Match['phase']): Map<string, Match> {
  const map = new Map<string, Match>()
  for (const m of matches) {
    if (m.phase === phase) map.set(pairKey(m.team_home, m.team_away), m)
  }
  return map
}

export interface OfficialResults {
  data: BracketData
  activeGroups: string[]   // groupes entièrement joués
  groupsComplete: boolean  // les 12 groupes sont terminés
}

export function buildOfficialResults(matches: Match[]): OfficialResults {
  const data = cloneDefault()
  const activeGroups: string[] = []

  // ── 1. Phase de groupes : classement → 1er/2e/3e de chaque groupe ──────────
  const thirdByGroup = new Map<string, string>()
  for (const { group, rows } of computeGroupStandings(matches)) {
    if (rows.length !== 4 || rows.some(r => r.played === 0)) continue
    const teams = GROUP_TEAMS[group]
    if (!teams) continue
    const idx = rows.slice(0, 3).map(r => teams.findIndex(t => t.name === r.name))
    if (idx.some(i => i < 0)) continue
    data.groupQualified[group] = [idx[0], idx[1], idx[2]]
    thirdByGroup.set(group, rows[2].name)
    activeGroups.push(group)
  }

  // ── 2. Meilleurs 3es : groupes dont le 3e apparaît dans un match de S16 ─────
  const r32Teams = new Set<string>()
  for (const m of matches) {
    if (m.phase === 'seiziemes') { r32Teams.add(m.team_home); r32Teams.add(m.team_away) }
  }
  const bestThirds: string[] = []
  for (const [group, third] of thirdByGroup) {
    if (r32Teams.has(third)) bestThirds.push(group)
  }
  if (bestThirds.length === 8) data.bestThirds = bestThirds.sort()

  // ── 3. Seizièmes (R32) ─────────────────────────────────────────────────────
  const r32map = indexByPair(matches, 'seiziemes')
  for (let i = 0; i < 16; i++) {
    const t0 = getR32Team(data, i, 0)
    const t1 = getR32Team(data, i, 1)
    if (!t0 || !t1) continue
    const m = r32map.get(pairKey(t0.name, t1.name))
    if (!m) continue
    const w = winnerName(m)
    if (w == null) continue
    data.r32[i] = w === t0.name ? 0 : 1
  }

  // ── 4. Huitièmes (R16) ─────────────────────────────────────────────────────
  const r16map = indexByPair(matches, 'huitiemes')
  for (let i = 0; i < 8; i++) {
    const t0 = getR16Team(data, i, 0)
    const t1 = getR16Team(data, i, 1)
    if (!t0 || !t1) continue
    const m = r16map.get(pairKey(t0.name, t1.name))
    if (!m) continue
    const w = winnerName(m)
    if (w == null) continue
    data.r16[i] = w === t0.name ? 0 : 1
  }

  // ── 5. Quarts ──────────────────────────────────────────────────────────────
  const qmap = indexByPair(matches, 'quarts')
  for (let i = 0; i < 4; i++) {
    const t0 = getQuarterTeam(data, i, 0)
    const t1 = getQuarterTeam(data, i, 1)
    if (!t0 || !t1) continue
    const m = qmap.get(pairKey(t0.name, t1.name))
    if (!m) continue
    const w = winnerName(m)
    if (w == null) continue
    data.quarters[i] = w === t0.name ? 0 : 1
  }

  // ── 6. Demi-finales ────────────────────────────────────────────────────────
  const smap = indexByPair(matches, 'demis')
  for (let i = 0; i < 2; i++) {
    const t0 = getSemiTeam(data, i, 0)
    const t1 = getSemiTeam(data, i, 1)
    if (!t0 || !t1) continue
    const m = smap.get(pairKey(t0.name, t1.name))
    if (!m) continue
    const w = winnerName(m)
    if (w == null) continue
    data.semis[i] = w === t0.name ? 0 : 1
  }

  // ── 7. Finale + petite finale (3e place) — phase 'finale' ──────────────────
  const finals = matches.filter(m => m.phase === 'finale')

  const f0 = getSemiWinner(data, 0)
  const f1 = getSemiWinner(data, 1)
  if (f0 && f1) {
    const fm = finals.find(m => pairKey(m.team_home, m.team_away) === pairKey(f0.name, f1.name))
    if (fm) { const w = winnerName(fm); if (w != null) data.final = w === f0.name ? 0 : 1 }
  }

  const l0 = getSemiLoser(data, 0)
  const l1 = getSemiLoser(data, 1)
  if (l0 && l1) {
    const tpm = finals.find(m => pairKey(m.team_home, m.team_away) === pairKey(l0.name, l1.name))
    if (tpm) { const w = winnerName(tpm); if (w != null) data.thirdPlace = w === l0.name ? 0 : 1 }
  }

  return { data, activeGroups, groupsComplete: activeGroups.length === 12 }
}
