import type { BracketData } from './bracketData'
import {
  GROUPS,
  getR16Winner,
  getQuarterWinner,
  getSemiWinner,
  getChampion,
  getThirdPlace,
} from './bracketData'

// ─── Barème ───────────────────────────────────────────────────────────────────
// Groupes  : 2 pts par équipe correctement dans le top-2 (peu importe le rang)
// 1/8      : 5 pts par bon gagnant
// Quarts   : 10 pts par bon gagnant
// Demies   : 15 pts par bon gagnant
// Finale   : 25 pts pour le bon champion
// 3e place : 10 pts

export const SCORE_CONFIG = {
  groupQualified: 2,
  r16: 5,
  quarter: 10,
  semi: 15,
  final: 25,
  thirdPlace: 10,
}

export interface ScoreBreakdown {
  groups: number
  r16: number
  quarters: number
  semis: number
  final: number
  thirdPlace: number
  total: number
}

export function calculateScore(player: BracketData, real: BracketData): ScoreBreakdown {
  let groups = 0, r16 = 0, quarters = 0, semis = 0, finalPts = 0, thirdPts = 0

  // Groupes : 2 pts pour chaque équipe correctement dans le top-2 (ordre indifférent)
  for (const g of GROUPS) {
    const realQ = real.groupQualified[g]
    const playerQ = player.groupQualified[g]
    if (!realQ || !playerQ) continue
    const realSet = new Set(realQ)
    for (const idx of playerQ) {
      if (realSet.has(idx)) groups += SCORE_CONFIG.groupQualified
    }
  }

  // 1/8 de finale
  for (let i = 0; i < 8; i++) {
    const rW = getR16Winner(real, i)
    const pW = getR16Winner(player, i)
    if (rW && pW && rW.name === pW.name) r16 += SCORE_CONFIG.r16
  }

  // Quarts
  for (let i = 0; i < 4; i++) {
    const rW = getQuarterWinner(real, i)
    const pW = getQuarterWinner(player, i)
    if (rW && pW && rW.name === pW.name) quarters += SCORE_CONFIG.quarter
  }

  // Demi-finales
  for (let i = 0; i < 2; i++) {
    const rW = getSemiWinner(real, i)
    const pW = getSemiWinner(player, i)
    if (rW && pW && rW.name === pW.name) semis += SCORE_CONFIG.semi
  }

  // Finale / champion
  const rChampion = getChampion(real)
  const pChampion = getChampion(player)
  if (rChampion && pChampion && rChampion.name === pChampion.name) finalPts += SCORE_CONFIG.final

  // 3e place
  const rThird = getThirdPlace(real)
  const pThird = getThirdPlace(player)
  if (rThird && pThird && rThird.name === pThird.name) thirdPts += SCORE_CONFIG.thirdPlace

  return {
    groups,
    r16,
    quarters,
    semis,
    final: finalPts,
    thirdPlace: thirdPts,
    total: groups + r16 + quarters + semis + finalPts + thirdPts,
  }
}
