// ─── Types ────────────────────────────────────────────────────────────────────

export interface Team {
  name: string
  flag: string
}

export interface BracketData {
  groupQualified: Record<string, [number, number, number]>  // [1er, 2e, 3e] (-1 = non sélectionné)
  bestThirds: string[]                                      // 8 lettres de groupe dont le 3e se qualifie
  r32: (0 | 1 | null)[]   // 16 matchs — seizièmes de finale
  r16: (0 | 1 | null)[]   // 8 matchs  — huitièmes de finale
  quarters: (0 | 1 | null)[]
  semis: (0 | 1 | null)[]
  final: (0 | 1 | null)
  thirdPlace: (0 | 1 | null)
}

// ─── R32 match types ──────────────────────────────────────────────────────────

export interface R32GroupMatch {
  type: 'group'
  t1: { g: string; rank: 1 | 2 }
  t2: { g: string; rank: 1 | 2 }
}
export interface R32ThirdMatch {
  type: 'third'
  slot1: number  // index 0-7 dans bestThirds trié
  slot2: number
}
export type R32Match = R32GroupMatch | R32ThirdMatch

// ─── Groupes ──────────────────────────────────────────────────────────────────

export const GROUP_TEAMS: Record<string, Team[]> = {
  A: [
    { name: 'Mexique', flag: '🇲🇽' },
    { name: 'Afrique du Sud', flag: '🇿🇦' },
    { name: 'Corée du Sud', flag: '🇰🇷' },
    { name: 'Tchéquie', flag: '🇨🇿' },
  ],
  B: [
    { name: 'Canada', flag: '🇨🇦' },
    { name: 'Bosnie-Herzégovine', flag: '🇧🇦' },
    { name: 'Qatar', flag: '🇶🇦' },
    { name: 'Suisse', flag: '🇨🇭' },
  ],
  C: [
    { name: 'Brésil', flag: '🇧🇷' },
    { name: 'Maroc', flag: '🇲🇦' },
    { name: 'Haïti', flag: '🇭🇹' },
    { name: 'Écosse', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  ],
  D: [
    { name: 'États-Unis', flag: '🇺🇸' },
    { name: 'Paraguay', flag: '🇵🇾' },
    { name: 'Australie', flag: '🇦🇺' },
    { name: 'Turquie', flag: '🇹🇷' },
  ],
  E: [
    { name: 'Allemagne', flag: '🇩🇪' },
    { name: 'Curaçao', flag: '🇨🇼' },
    { name: "Côte d'Ivoire", flag: '🇨🇮' },
    { name: 'Équateur', flag: '🇪🇨' },
  ],
  F: [
    { name: 'Pays-Bas', flag: '🇳🇱' },
    { name: 'Japon', flag: '🇯🇵' },
    { name: 'Suède', flag: '🇸🇪' },
    { name: 'Tunisie', flag: '🇹🇳' },
  ],
  G: [
    { name: 'Belgique', flag: '🇧🇪' },
    { name: 'Égypte', flag: '🇪🇬' },
    { name: 'Iran', flag: '🇮🇷' },
    { name: 'Nouvelle-Zélande', flag: '🇳🇿' },
  ],
  H: [
    { name: 'Espagne', flag: '🇪🇸' },
    { name: 'Cap-Vert', flag: '🇨🇻' },
    { name: 'Arabie Saoudite', flag: '🇸🇦' },
    { name: 'Uruguay', flag: '🇺🇾' },
  ],
  I: [
    { name: 'France', flag: '🇫🇷' },
    { name: 'Sénégal', flag: '🇸🇳' },
    { name: 'Irak', flag: '🇮🇶' },
    { name: 'Norvège', flag: '🇳🇴' },
  ],
  J: [
    { name: 'Argentine', flag: '🇦🇷' },
    { name: 'Algérie', flag: '🇩🇿' },
    { name: 'Autriche', flag: '🇦🇹' },
    { name: 'Jordanie', flag: '🇯🇴' },
  ],
  K: [
    { name: 'Portugal', flag: '🇵🇹' },
    { name: 'RD Congo', flag: '🇨🇩' },
    { name: 'Ouzbékistan', flag: '🇺🇿' },
    { name: 'Colombie', flag: '🇨🇴' },
  ],
  L: [
    { name: 'Angleterre', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    { name: 'Croatie', flag: '🇭🇷' },
    { name: 'Ghana', flag: '🇬🇭' },
    { name: 'Panama', flag: '🇵🇦' },
  ],
}

export const GROUPS = Object.keys(GROUP_TEAMS)

// ─── Seizièmes de finale (R32) — 16 matchs ───────────────────────────────────
// 12 matchs fixes (chefs vs deuxièmes) + 4 matchs entre les 8 meilleurs 3es

export const R32_MATCHES: R32Match[] = [
  { type: 'group', t1: { g: 'A', rank: 1 }, t2: { g: 'B', rank: 2 } },  // 0
  { type: 'group', t1: { g: 'B', rank: 1 }, t2: { g: 'A', rank: 2 } },  // 1
  { type: 'group', t1: { g: 'C', rank: 1 }, t2: { g: 'D', rank: 2 } },  // 2
  { type: 'group', t1: { g: 'D', rank: 1 }, t2: { g: 'C', rank: 2 } },  // 3
  { type: 'group', t1: { g: 'E', rank: 1 }, t2: { g: 'F', rank: 2 } },  // 4
  { type: 'group', t1: { g: 'F', rank: 1 }, t2: { g: 'E', rank: 2 } },  // 5
  { type: 'group', t1: { g: 'G', rank: 1 }, t2: { g: 'H', rank: 2 } },  // 6
  { type: 'group', t1: { g: 'H', rank: 1 }, t2: { g: 'G', rank: 2 } },  // 7
  { type: 'group', t1: { g: 'I', rank: 1 }, t2: { g: 'J', rank: 2 } },  // 8
  { type: 'group', t1: { g: 'J', rank: 1 }, t2: { g: 'I', rank: 2 } },  // 9
  { type: 'group', t1: { g: 'K', rank: 1 }, t2: { g: 'L', rank: 2 } },  // 10
  { type: 'group', t1: { g: 'L', rank: 1 }, t2: { g: 'K', rank: 2 } },  // 11
  { type: 'third', slot1: 0, slot2: 1 },  // 12 — meilleurs 3es slots 0 vs 1
  { type: 'third', slot1: 2, slot2: 3 },  // 13 — meilleurs 3es slots 2 vs 3
  { type: 'third', slot1: 4, slot2: 5 },  // 14 — meilleurs 3es slots 4 vs 5
  { type: 'third', slot1: 6, slot2: 7 },  // 15 — meilleurs 3es slots 6 vs 7
]

// Alias kept for any remaining imports
export const EIGHTFINALS = R32_MATCHES

export const DEFAULT_DATA: BracketData = {
  groupQualified: Object.fromEntries(GROUPS.map(g => [g, [0, 1, 2] as [number, number, number]])),
  bestThirds: [],
  r32: Array(16).fill(null),
  r16: Array(8).fill(null),
  quarters: Array(4).fill(null),
  semis: Array(2).fill(null),
  final: null,
  thirdPlace: null,
}

// ─── Migration données anciennes → nouveau format ────────────────────────────

export function migrateData(raw: unknown): BracketData {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_DATA }
  const r = raw as Record<string, unknown>
  const isOldFormat = !('r32' in r)

  const data: BracketData = {
    groupQualified: { ...DEFAULT_DATA.groupQualified },
    bestThirds: [],
    r32: Array(16).fill(null),
    r16: Array(8).fill(null),
    quarters: Array(4).fill(null),
    semis: Array(2).fill(null),
    final: null,
    thirdPlace: null,
  }

  // groupQualified : ajouter le 3e si absent (ancien format = [n, n], nouveau = [n, n, n])
  if (r.groupQualified && typeof r.groupQualified === 'object') {
    for (const g of GROUPS) {
      const q = (r.groupQualified as Record<string, unknown>)[g]
      if (Array.isArray(q)) {
        const i0 = typeof q[0] === 'number' ? q[0] : 0
        const i1 = typeof q[1] === 'number' ? q[1] : 1
        const i2 = typeof q[2] === 'number' ? q[2] : -1
        data.groupQualified[g] = [i0, i1, isOldFormat ? -1 : i2]
      }
    }
  }

  if (!isOldFormat) {
    if (Array.isArray(r.bestThirds)) data.bestThirds = r.bestThirds as string[]
    if (Array.isArray(r.r32) && r.r32.length === 16) data.r32 = r.r32 as (0 | 1 | null)[]
    if (Array.isArray(r.r16) && r.r16.length === 8) data.r16 = r.r16 as (0 | 1 | null)[]
    if (Array.isArray(r.quarters) && r.quarters.length === 4) data.quarters = r.quarters as (0 | 1 | null)[]
    if (Array.isArray(r.semis) && r.semis.length === 2) data.semis = r.semis as (0 | 1 | null)[]
    if (r.final === 0 || r.final === 1 || r.final === null) data.final = r.final as 0 | 1 | null
    if (r.thirdPlace === 0 || r.thirdPlace === 1 || r.thirdPlace === null) data.thirdPlace = r.thirdPlace as 0 | 1 | null
  }
  // Ancien format : groupQualified migré mais toutes les phases éliminatoires réinitialisées

  return data
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getGroupTeam(data: BracketData, group: string, rank: 1 | 2 | 3): Team | null {
  const teams = GROUP_TEAMS[group]
  if (!teams) return null
  const qualified = data.groupQualified[group]
  if (!qualified) return null
  const idx = rank === 1 ? qualified[0] : rank === 2 ? qualified[1] : qualified[2]
  if (idx === -1 || idx === undefined) return null
  return teams[idx] ?? null
}

export function getBestThirdTeam(data: BracketData, slot: number): Team | null {
  const sorted = [...data.bestThirds].sort()
  const group = sorted[slot]
  if (!group) return null
  return getGroupTeam(data, group, 3)
}

export function getR32Team(data: BracketData, matchIdx: number, side: 0 | 1): Team | null {
  const m = R32_MATCHES[matchIdx]
  if (!m) return null
  if (m.type === 'group') {
    const s = side === 0 ? m.t1 : m.t2
    return getGroupTeam(data, s.g, s.rank)
  } else {
    const slot = side === 0 ? m.slot1 : m.slot2
    return getBestThirdTeam(data, slot)
  }
}

export function getR32Winner(data: BracketData, matchIdx: number): Team | null {
  const pick = data.r32[matchIdx]
  if (pick === null) return null
  return getR32Team(data, matchIdx, pick as 0 | 1)
}

export function getR16Team(data: BracketData, matchIdx: number, side: 0 | 1): Team | null {
  const r32Idx = matchIdx * 2 + side
  return getR32Winner(data, r32Idx)
}

export function getR16Winner(data: BracketData, matchIdx: number): Team | null {
  const pick = data.r16[matchIdx]
  if (pick === null) return null
  return getR16Team(data, matchIdx, pick as 0 | 1)
}

export function getQuarterTeam(data: BracketData, matchIdx: number, side: 0 | 1): Team | null {
  const r16Idx = matchIdx * 2 + side
  return getR16Winner(data, r16Idx)
}

export function getQuarterWinner(data: BracketData, matchIdx: number): Team | null {
  const pick = data.quarters[matchIdx]
  if (pick === null) return null
  return getQuarterTeam(data, matchIdx, pick as 0 | 1)
}

export function getSemiTeam(data: BracketData, matchIdx: number, side: 0 | 1): Team | null {
  const qIdx = matchIdx * 2 + side
  return getQuarterWinner(data, qIdx)
}

export function getSemiWinner(data: BracketData, matchIdx: number): Team | null {
  const pick = data.semis[matchIdx]
  if (pick === null) return null
  return getSemiTeam(data, matchIdx, pick as 0 | 1)
}

export function getSemiLoser(data: BracketData, matchIdx: number): Team | null {
  const pick = data.semis[matchIdx]
  if (pick === null) return null
  return getSemiTeam(data, matchIdx, (1 - pick) as 0 | 1)
}

export function getFinalTeam(data: BracketData, side: 0 | 1): Team | null {
  return getSemiWinner(data, side)
}

export function getChampion(data: BracketData): Team | null {
  const pick = data.final
  if (pick === null) return null
  return getFinalTeam(data, pick as 0 | 1)
}

export function getThirdPlace(data: BracketData): Team | null {
  const pick = data.thirdPlace
  if (pick === null) return null
  return pick === 0 ? getSemiLoser(data, 0) : getSemiLoser(data, 1)
}
