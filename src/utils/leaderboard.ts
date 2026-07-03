import type { Match } from '../types'
import { migrateData } from './bracketData'
import { calculateScore } from './scoreUtils'
import { buildOfficialResults } from './officialResults'

// ════════════════════════════════════════════════════════════════════════════
//  computeLeaderboard — classement ordonné calculé depuis les scores.
//  Même logique de tri que ClassementV2 (total décroissant, puis pseudo).
//  Utilisé par l'Admin pour enregistrer un instantané (rank_snapshots).
// ════════════════════════════════════════════════════════════════════════════

export interface LeaderboardRow {
  player_id: string
  points: number
  rank: number
}

export function computeLeaderboard(
  matches: Match[],
  preds: { player_id: string; data: unknown }[],
  players: { id: string; pseudo: string }[],
): LeaderboardRow[] {
  const { data: real } = buildOfficialResults(matches)
  const pm = new Map(preds.map(p => [p.player_id, migrateData(p.data)]))

  const scored = players.map(p => {
    const bd = pm.get(p.id)
    const total = bd ? calculateScore(bd, real).total : 0
    return { player_id: p.id, pseudo: p.pseudo, points: total }
  })

  scored.sort((a, b) => b.points - a.points || a.pseudo.localeCompare(b.pseudo))

  return scored.map((s, i) => ({ player_id: s.player_id, points: s.points, rank: i + 1 }))
}
