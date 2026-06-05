import type { BracketData } from './bracketData'
import {
  GROUPS,
  getR32Winner,
  getR16Winner,
  getQuarterWinner,
  getSemiWinner,
  getChampion,
  getThirdPlace,
} from './bracketData'

// ─── Barème ───────────────────────────────────────────────────────────────────
// Groupes     : 2 pts par équipe correctement dans le top-2
// Seizièmes   : 2 pts par bon gagnant (16 matchs)
// Huitièmes   : 5 pts par bon gagnant (8 matchs)
// Quarts      : 10 pts par bon gagnant
// Demies      : 15 pts par bon gagnant
// Finale      : 25 pts pour le bon champion
// 3e place    : 10 pts

export const SCORE_CONFIG = {
  groupQualified: 2,
  r32: 2,
  r16: 5,
  quarter: 10,
  semi: 15,
  final: 25,
  thirdPlace: 10,
}

export interface ScoreBreakdown {
  groups: number
  r32: number
  r16: number
  quarters: number
  semis: number
  final: number
  thirdPlace: number
  total: number
}

export function calculateScore(player: BracketData, real: BracketData): ScoreBreakdown {
  let groups = 0, r32 = 0, r16 = 0, quarters = 0, semis = 0, finalPts = 0, thirdPts = 0

  // Groupes : 2 pts pour chaque équipe correctement dans le top-2 (ordre indifférent)
  for (const g of GROUPS) {
    const realQ = real.groupQualified[g]
    const playerQ = player.groupQualified[g]
    if (!realQ || !playerQ) continue
    const realSet = new Set([realQ[0], realQ[1]])
    for (const idx of [playerQ[0], playerQ[1]]) {
      if (realSet.has(idx)) groups += SCORE_CONFIG.groupQualified
    }
  }

  // Seizièmes de finale (16 matchs)
  for (let i = 0; i < 16; i++) {
    const rW = getR32Winner(real, i)
    const pW = getR32Winner(player, i)
    if (rW && pW && rW.name === pW.name) r32 += SCORE_CONFIG.r32
  }

  // Huitièmes de finale (8 matchs)
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
    r32,
    r16,
    quarters,
    semis,
    final: finalPts,
    thirdPlace: thirdPts,
    total: groups + r32 + r16 + quarters + semis + finalPts + thirdPts,
  }
}
