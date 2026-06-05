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
  host: { g: string }  // 1er de ce groupe (côté 0)
  eligible: string[]   // groupes éligibles pour la 3e (côté 1)
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

// ─── Seizièmes de finale (R32) — 16 matchs officiels FIFA 2026 ───────────────
// Source : https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage
// 8 matchs fixes (1er/2e de groupe) + 8 matchs 1er vs meilleur 3e

export const R32_MATCHES: R32Match[] = [
  { type: 'group', t1: {g:'A', rank:2}, t2: {g:'B', rank:2} },                    // 0  M73
  { type: 'third', host: {g:'E'}, eligible: ['A','B','C','D','F'] },               // 1  M74  1E vs 3e
  { type: 'group', t1: {g:'F', rank:1}, t2: {g:'C', rank:2} },                    // 2  M75
  { type: 'group', t1: {g:'C', rank:1}, t2: {g:'F', rank:2} },                    // 3  M76
  { type: 'third', host: {g:'I'}, eligible: ['C','D','F','G','H'] },               // 4  M77  1I vs 3e
  { type: 'group', t1: {g:'E', rank:2}, t2: {g:'I', rank:2} },                    // 5  M78
  { type: 'third', host: {g:'A'}, eligible: ['C','E','F','H','I'] },               // 6  M79  1A vs 3e
  { type: 'third', host: {g:'L'}, eligible: ['E','H','I','J','K'] },               // 7  M80  1L vs 3e
  { type: 'third', host: {g:'D'}, eligible: ['B','E','F','I','J'] },               // 8  M81  1D vs 3e
  { type: 'third', host: {g:'G'}, eligible: ['A','E','H','I','J'] },               // 9  M82  1G vs 3e
  { type: 'group', t1: {g:'K', rank:2}, t2: {g:'L', rank:2} },                    // 10 M83
  { type: 'group', t1: {g:'H', rank:1}, t2: {g:'J', rank:2} },                    // 11 M84
  { type: 'third', host: {g:'B'}, eligible: ['E','F','G','I','J'] },               // 12 M85  1B vs 3e
  { type: 'group', t1: {g:'J', rank:1}, t2: {g:'H', rank:2} },                    // 13 M86
  { type: 'third', host: {g:'K'}, eligible: ['D','E','I','J','L'] },               // 14 M87  1K vs 3e
  { type: 'group', t1: {g:'D', rank:2}, t2: {g:'G', rank:2} },                    // 15 M88
]

// Alias kept for any remaining imports
export const EIGHTFINALS = R32_MATCHES

// ─── Huitièmes de finale (R16) — pairages officiels ──────────────────────────
// Ordonnés pour que les QF restent séquentiels :
// QF[i] = R16[i*2] vs R16[i*2+1]  →  SF[i] = QF[i*2] vs QF[i*2+1]

export const R16_PAIRS = [
  { r32a: 1,  r32b: 4  },  // R16[0] M89: W74 vs W77  → QF[0] côté 0
  { r32a: 0,  r32b: 2  },  // R16[1] M90: W73 vs W75  → QF[0] côté 1
  { r32a: 10, r32b: 11 },  // R16[2] M93: W83 vs W84  → QF[1] côté 0
  { r32a: 8,  r32b: 9  },  // R16[3] M94: W81 vs W82  → QF[1] côté 1
  { r32a: 3,  r32b: 5  },  // R16[4] M91: W76 vs W78  → QF[2] côté 0
  { r32a: 6,  r32b: 7  },  // R16[5] M92: W79 vs W80  → QF[2] côté 1
  { r32a: 13, r32b: 15 },  // R16[6] M95: W86 vs W88  → QF[3] côté 0
  { r32a: 12, r32b: 14 },  // R16[7] M96: W85 vs W87  → QF[3] côté 1
]
// QF[0]=M97(W89/W90), QF[1]=M98(W93/W94), QF[2]=M99(W91/W92), QF[3]=M100(W95/W96)
// SF[0]=M101(W97/W98), SF[1]=M102(W99/W100)

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
    r32: Array(16).fill(null),   // toujours réinitialisé — structure changée
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

// ─── Bipartite matching — assignation des 3es aux matchs de seizièmes ────────

const THIRD_SLOT_INDICES: number[] = R32_MATCHES.reduce((acc: number[], m, i) => {
  if (m.type === 'third') acc.push(i)
  return acc
}, [])
// = [1, 4, 6, 7, 8, 9, 12, 14]

function computeThirdAssignment(selectedGroups: string[]): Map<number, string> {
  const result = new Map<number, string>()
  if (selectedGroups.length !== 8) return result
  const selected = new Set(selectedGroups)
  const used = new Set<string>()

  function backtrack(slotIdx: number): boolean {
    if (slotIdx === THIRD_SLOT_INDICES.length) return true
    const matchIdx = THIRD_SLOT_INDICES[slotIdx]
    const m = R32_MATCHES[matchIdx] as R32ThirdMatch
    for (const group of m.eligible) {
      if (selected.has(group) && !used.has(group)) {
        result.set(matchIdx, group)
        used.add(group)
        if (backtrack(slotIdx + 1)) return true
        result.delete(matchIdx)
        used.delete(group)
      }
    }
    return false
  }

  backtrack(0)
  return result
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

export function getR32Team(data: BracketData, matchIdx: number, side: 0 | 1): Team | null {
  const m = R32_MATCHES[matchIdx]
  if (!m) return null
  if (m.type === 'group') {
    const s = side === 0 ? m.t1 : m.t2
    return getGroupTeam(data, s.g, s.rank)
  } else {
    if (side === 0) return getGroupTeam(data, m.host.g, 1)
    const assignment = computeThirdAssignment(data.bestThirds)
    const group = assignment.get(matchIdx)
    return group ? getGroupTeam(data, group, 3) : null
  }
}

export function getR32Winner(data: BracketData, matchIdx: number): Team | null {
  const pick = data.r32[matchIdx]
  if (pick === null) return null
  return getR32Team(data, matchIdx, pick as 0 | 1)
}

export function getR16Team(data: BracketData, matchIdx: number, side: 0 | 1): Team | null {
  const pair = R16_PAIRS[matchIdx]
  if (!pair) return null
  return getR32Winner(data, side === 0 ? pair.r32a : pair.r32b)
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
