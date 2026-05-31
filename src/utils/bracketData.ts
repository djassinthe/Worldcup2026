// ─── Types ────────────────────────────────────────────────────────────────────

export interface Team {
  name: string
  flag: string
}

export interface BracketData {
  groupQualified: Record<string, [number, number]>
  r16: (0 | 1 | null)[]
  quarters: (0 | 1 | null)[]
  semis: (0 | 1 | null)[]
  final: (0 | 1 | null)
  thirdPlace: (0 | 1 | null)
}

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

export const EIGHTFINALS = [
  { t1: { g: 'A', rank: 1 }, t2: { g: 'B', rank: 2 } },
  { t1: { g: 'C', rank: 1 }, t2: { g: 'D', rank: 2 } },
  { t1: { g: 'E', rank: 1 }, t2: { g: 'F', rank: 2 } },
  { t1: { g: 'G', rank: 1 }, t2: { g: 'H', rank: 2 } },
  { t1: { g: 'I', rank: 1 }, t2: { g: 'J', rank: 2 } },
  { t1: { g: 'K', rank: 1 }, t2: { g: 'L', rank: 2 } },
  { t1: { g: 'B', rank: 1 }, t2: { g: 'A', rank: 2 } },
  { t1: { g: 'D', rank: 1 }, t2: { g: 'C', rank: 2 } },
]

export const DEFAULT_DATA: BracketData = {
  groupQualified: Object.fromEntries(GROUPS.map(g => [g, [0, 1] as [number, number]])),
  r16: Array(8).fill(null),
  quarters: Array(4).fill(null),
  semis: Array(2).fill(null),
  final: null,
  thirdPlace: null,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getGroupTeam(data: BracketData, group: string, rank: 1 | 2): Team | null {
  const teams = GROUP_TEAMS[group]
  if (!teams) return null
  const qualified = data.groupQualified[group]
  if (!qualified) return null
  const idx = rank === 1 ? qualified[0] : qualified[1]
  return teams[idx] ?? null
}

export function getR16Winner(data: BracketData, matchIdx: number): Team | null {
  const pick = data.r16[matchIdx]
  if (pick === null) return null
  const m = EIGHTFINALS[matchIdx]
  const side = pick === 0 ? m.t1 : m.t2
  return getGroupTeam(data, side.g, side.rank as 1 | 2)
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
