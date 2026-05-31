import { useState, useEffect } from 'react'
import { Check, Trophy, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Team {
  name: string
  flag: string
}

interface BracketData {
  // Pour chaque groupe : [1er, 2ème] index dans GROUP_TEAMS[key]
  groupQualified: Record<string, [number, number]>
  // Pour les phases éliminatoires : index gagnant (0 = team1, 1 = team2)
  r16: (0 | 1 | null)[]      // 32 équipes → 16 matchs
  quarters: (0 | 1 | null)[] // 8 → 4
  semis: (0 | 1 | null)[]    // 4 → 2
  final: (0 | 1 | null)      // 2 → 1
  thirdPlace: (0 | 1 | null) // 3rd place
}

// ─── Données des groupes ─────────────────────────────────────────────────────

const GROUP_TEAMS: Record<string, Team[]> = {
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
    { name: "Curaçao", flag: '🇨🇼' },
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

const GROUPS = Object.keys(GROUP_TEAMS) // A..L



// Simplifié : 16 matchs de 1/8 (32 équipes : 1er et 2ème de chaque groupe)
// Ordre bracket standard FIFA :
// Match 1 : 1A vs 2B
// Match 2 : 1C vs 2D
// Match 3 : 1E vs 2F
// Match 4 : 1G vs 2H
// Match 5 : 1I vs 2J
// Match 6 : 1K vs 2L
// Match 7 : 1B vs 2A
// Match 8 : 1D vs 2C
// Match 9 : 1F vs 2E
// Match 10 : 1H vs 2G
// Match 11 : 1J vs 2I
// Match 12 : 1L vs 2K
// (12 matchs pour 24 équipes issues des groupes + 8 matchs de "seizièmes" pour les 3e places)
// → Pour simplifier: on n'affiche que 8 matchs en quarts (= 1/4), le joueur choisit directement les finalistes des groupes

// ─── APPROCHE SIMPLIFIÉE : bracket à 16 équipes ─────────────────────────────
// 1er de chaque groupe → directement en huitièmes de finale (8 matchs)
// Note: en réalité c'est 32 équipes avec 12 groupes, mais on simplifie
// On prend les 1ers de A..H vs 2ème de groupes correspondants
// Standard FIFA 2026: le bracket officiel n'est pas encore publié
// On utilise: 1A-2B, 1C-2D, 1E-2F, 1G-2H (quarts de la moitié haute)
//             1I-2J, 1K-2L, 1B-2A, 1D-2C (quarts de la moitié basse)
// → 8 huitièmes → 4 quarts → 2 demies → 1 finale + match 3e place

// Format des huitièmes (8 matchs) :

// 8 matchs de huitièmes:
const EIGHTFINALS = [
  { t1: { g: 'A', rank: 1 }, t2: { g: 'B', rank: 2 } },
  { t1: { g: 'C', rank: 1 }, t2: { g: 'D', rank: 2 } },
  { t1: { g: 'E', rank: 1 }, t2: { g: 'F', rank: 2 } },
  { t1: { g: 'G', rank: 1 }, t2: { g: 'H', rank: 2 } },
  { t1: { g: 'I', rank: 1 }, t2: { g: 'J', rank: 2 } },
  { t1: { g: 'K', rank: 1 }, t2: { g: 'L', rank: 2 } },
  { t1: { g: 'B', rank: 1 }, t2: { g: 'A', rank: 2 } },
  { t1: { g: 'D', rank: 1 }, t2: { g: 'C', rank: 2 } },
]

const DEFAULT_DATA: BracketData = {
  groupQualified: Object.fromEntries(GROUPS.map(g => [g, [0, 1]])),
  r16: Array(8).fill(null),
  quarters: Array(4).fill(null),
  semis: Array(2).fill(null),
  final: null,
  thirdPlace: null,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGroupTeam(data: BracketData, group: string, rank: 1 | 2): Team | null {
  const teams = GROUP_TEAMS[group]
  if (!teams) return null
  const qualified = data.groupQualified[group]
  if (!qualified) return null
  const idx = rank === 1 ? qualified[0] : qualified[1]
  return teams[idx] ?? null
}

function getR16Winner(data: BracketData, matchIdx: number): Team | null {
  const pick = data.r16[matchIdx]
  if (pick === null) return null
  const m = EIGHTFINALS[matchIdx]
  const side = pick === 0 ? m.t1 : m.t2
  return getGroupTeam(data, side.g, side.rank as 1 | 2)
}

function getQuarterTeam(data: BracketData, matchIdx: number, side: 0 | 1): Team | null {
  const r16Idx = matchIdx * 2 + side
  return getR16Winner(data, r16Idx)
}

function getQuarterWinner(data: BracketData, matchIdx: number): Team | null {
  const pick = data.quarters[matchIdx]
  if (pick === null) return null
  return getQuarterTeam(data, matchIdx, pick as 0 | 1)
}

function getSemiTeam(data: BracketData, matchIdx: number, side: 0 | 1): Team | null {
  const qIdx = matchIdx * 2 + side
  return getQuarterWinner(data, qIdx)
}

function getSemiWinner(data: BracketData, matchIdx: number): Team | null {
  const pick = data.semis[matchIdx]
  if (pick === null) return null
  return getSemiTeam(data, matchIdx, pick as 0 | 1)
}

function getSemiLoser(data: BracketData, matchIdx: number): Team | null {
  const pick = data.semis[matchIdx]
  if (pick === null) return null
  return getSemiTeam(data, matchIdx, (1 - pick) as 0 | 1)
}

function getFinalTeam(data: BracketData, side: 0 | 1): Team | null {
  return getSemiWinner(data, side)
}

function getChampion(data: BracketData): Team | null {
  const pick = data.final
  if (pick === null) return null
  return getFinalTeam(data, pick as 0 | 1)
}

// ─── Composant TeamChip ───────────────────────────────────────────────────────

function TeamChip({
  team,
  selected,
  disabled,
  onClick,
}: {
  team: Team | null
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
}) {
  if (!team) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 text-sm italic min-w-[140px]">
        <span className="text-base opacity-40">?</span>
        <span>À déterminer</span>
      </div>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all min-w-[140px] text-left
        ${selected
          ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/40 scale-[1.02]'
          : disabled
            ? 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 cursor-default'
            : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-slate-600 cursor-pointer'
        }`}
    >
      <span className="text-base leading-none">{team.flag}</span>
      <span className="truncate">{team.name}</span>
      {selected && <Check size={13} className="ml-auto shrink-0" />}
    </button>
  )
}

// ─── Composant MatchBox ───────────────────────────────────────────────────────

function MatchBox({
  label,
  team1,
  team2,
  winner,
  onPick,
  size = 'md',
}: {
  label?: string
  team1: Team | null
  team2: Team | null
  winner: 0 | 1 | null
  onPick: (side: 0 | 1) => void
  size?: 'sm' | 'md' | 'lg'
}) {
  const canPick = team1 && team2

  return (
    <div className={`flex flex-col gap-1 ${size === 'lg' ? 'w-52' : size === 'sm' ? 'w-36' : 'w-44'}`}>
      {label && (
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500 text-center mb-0.5">
          {label}
        </span>
      )}
      <TeamChip
        team={team1}
        selected={winner === 0}
        disabled={!canPick}
        onClick={canPick ? () => onPick(0) : undefined}
      />
      <div className="text-center text-[10px] text-gray-400 dark:text-slate-500 font-medium">VS</div>
      <TeamChip
        team={team2}
        selected={winner === 1}
        disabled={!canPick}
        onClick={canPick ? () => onPick(1) : undefined}
      />
    </div>
  )
}

// ─── Composant GroupCard ──────────────────────────────────────────────────────

function GroupCard({
  group,
  qualified,
  onChange,
}: {
  group: string
  qualified: [number, number]
  onChange: (q: [number, number]) => void
}) {
  const teams = GROUP_TEAMS[group]

  function toggle(idx: number) {
    const [first, second] = qualified
    if (first === idx) {
      // Deselect first — do nothing (must keep 2)
      return
    }
    if (second === idx) {
      return
    }
    // Replace the one that's not yet locked — cycle: click = become 1st, then 2nd
    // Simple rule: click replaces "2nd" slot if not already selected
    // Actually: first click on unselected → becomes 1st, pushes old 1st to 2nd
    onChange([idx, first])
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400">
          Groupe {group}
        </span>
        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500">
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
          <span className="w-5 h-5 rounded-full bg-blue-400 text-white flex items-center justify-center text-[10px] font-bold">2</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {teams.map((team, idx) => {
          const rank = idx === qualified[0] ? 1 : idx === qualified[1] ? 2 : null
          return (
            <button
              key={idx}
              onClick={() => toggle(idx)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left
                ${rank === 1
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : rank === 2
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium'
                    : 'bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
            >
              <span className="text-base leading-none">{team.flag}</span>
              <span className="flex-1 truncate">{team.name}</span>
              {rank && (
                <span className={`ml-auto text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center
                  ${rank === 1 ? 'bg-white/20' : 'bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300'}`}>
                  {rank}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'groupes', label: 'Groupes' },
  { id: 'huitiemes', label: '1/8' },
  { id: 'quarts', label: '1/4' },
  { id: 'demis', label: 'Demies' },
  { id: 'finale', label: 'Finale' },
]

// ─── Page principale ──────────────────────────────────────────────────────────

export default function BracketPage() {
  const { player } = useAuth()
  const [tab, setTab] = useState('groupes')
  const [data, setData] = useState<BracketData>(DEFAULT_DATA)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Charger le bracket du joueur
  useEffect(() => {
    if (!player) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any)
      .from('bracket_predictions')
      .select('data')
      .eq('player_id', player.id)
      .maybeSingle()
      .then(({ data: row }: { data: { data: BracketData } | null }) => {
        if (row?.data) {
          setData({ ...DEFAULT_DATA, ...(row.data as BracketData) })
        }
        setLoaded(true)
      })
  }, [player])

  function update(fn: (d: BracketData) => BracketData) {
    setData(prev => fn({ ...prev }))
    setDirty(true)
  }

  function setGroupQualified(group: string, q: [number, number]) {
    update(d => {
      // Reset downstream when groups change
      return {
        ...d,
        groupQualified: { ...d.groupQualified, [group]: q },
        r16: Array(8).fill(null),
        quarters: Array(4).fill(null),
        semis: Array(2).fill(null),
        final: null,
        thirdPlace: null,
      }
    })
  }

  function pickR16(matchIdx: number, side: 0 | 1) {
    update(d => {
      const newR16 = [...d.r16] as (0 | 1 | null)[]
      newR16[matchIdx] = side
      return {
        ...d,
        r16: newR16,
        // Reset downstream
        quarters: Array(4).fill(null),
        semis: Array(2).fill(null),
        final: null,
        thirdPlace: null,
      }
    })
  }

  function pickQuarter(matchIdx: number, side: 0 | 1) {
    update(d => {
      const newQ = [...d.quarters] as (0 | 1 | null)[]
      newQ[matchIdx] = side
      return {
        ...d,
        quarters: newQ,
        semis: Array(2).fill(null),
        final: null,
        thirdPlace: null,
      }
    })
  }

  function pickSemi(matchIdx: number, side: 0 | 1) {
    update(d => {
      const newS = [...d.semis] as (0 | 1 | null)[]
      newS[matchIdx] = side
      return { ...d, semis: newS, final: null, thirdPlace: null }
    })
  }

  function pickFinal(side: 0 | 1) {
    update(d => ({ ...d, final: side }))
  }

  function pickThirdPlace(side: 0 | 1) {
    update(d => ({ ...d, thirdPlace: side }))
  }

  async function save() {
    if (!player) return
    setSaving(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('bracket_predictions')
      .upsert({ player_id: player.id, data, updated_at: new Date().toISOString() }, { onConflict: 'player_id' })
    setSaving(false)
    if (error) {
      toast.error('Erreur de sauvegarde')
    } else {
      toast.success('Bracket sauvegardé !')
      setDirty(false)
    }
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const champion = getChampion(data)
  const thirdPlaceLoser0 = getSemiLoser(data, 0)
  const thirdPlaceLoser1 = getSemiLoser(data, 1)

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Mon bracket</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            Choisis les qualifiés de chaque phase
          </p>
        </div>
        <button
          onClick={save}
          disabled={!dirty || saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${dirty
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-default'
            }`}
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save size={15} />
          )}
          {saving ? 'Sauvegarde...' : dirty ? 'Sauvegarder' : 'Sauvegardé'}
        </button>
      </div>

      {/* Champion badge */}
      {champion && (
        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-xl">
          <Trophy className="text-yellow-500" size={20} />
          <div>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Mon champion prédit</p>
            <p className="text-base font-bold text-yellow-800 dark:text-yellow-200">
              {champion.flag} {champion.name}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === t.id
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── TAB: GROUPES ─── */}
      {tab === 'groupes' && (
        <div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
            Clique sur une équipe pour la mettre en 1ère place, elle pousse l'ancienne 1ère en 2ème place.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {GROUPS.map(g => (
              <GroupCard
                key={g}
                group={g}
                qualified={data.groupQualified[g] as [number, number]}
                onChange={q => setGroupQualified(g, q)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB: HUITIÈMES ─── */}
      {tab === 'huitiemes' && (
        <div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
            Clique sur l'équipe que tu penses gagnante de chaque match.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {EIGHTFINALS.map((m, i) => {
              const t1 = getGroupTeam(data, m.t1.g, m.t1.rank as 1 | 2)
              const t2 = getGroupTeam(data, m.t2.g, m.t2.rank as 1 | 2)
              return (
                <MatchBox
                  key={i}
                  label={`Match ${i + 1}`}
                  team1={t1}
                  team2={t2}
                  winner={data.r16[i]}
                  onPick={side => pickR16(i, side)}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* ─── TAB: QUARTS ─── */}
      {tab === 'quarts' && (
        <div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
            Les gagnants des 1/8 s'affrontent. Choisis qui avance.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {Array.from({ length: 4 }, (_, i) => {
              const t1 = getQuarterTeam(data, i, 0)
              const t2 = getQuarterTeam(data, i, 1)
              return (
                <MatchBox
                  key={i}
                  label={`Quart ${i + 1}`}
                  team1={t1}
                  team2={t2}
                  winner={data.quarters[i]}
                  onPick={side => pickQuarter(i, side)}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* ─── TAB: DEMIES ─── */}
      {tab === 'demis' && (
        <div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
            Qui passe en finale ?
          </p>
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-2 gap-6">
              {Array.from({ length: 2 }, (_, i) => {
                const t1 = getSemiTeam(data, i, 0)
                const t2 = getSemiTeam(data, i, 1)
                return (
                  <MatchBox
                    key={i}
                    label={`Demi-finale ${i + 1}`}
                    team1={t1}
                    team2={t2}
                    winner={data.semis[i]}
                    onPick={side => pickSemi(i, side)}
                    size="lg"
                  />
                )
              })}
            </div>
            {/* Match pour la 3e place */}
            {thirdPlaceLoser0 && thirdPlaceLoser1 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-2">
                  Match pour la 3e place
                </p>
                <div className="inline-block">
                  <MatchBox
                    team1={thirdPlaceLoser0}
                    team2={thirdPlaceLoser1}
                    winner={data.thirdPlace}
                    onPick={side => pickThirdPlace(side)}
                    size="lg"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB: FINALE ─── */}
      {tab === 'finale' && (
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Qui soulève la coupe ?</p>
            <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">🏆 Grande Finale</p>
          </div>
          <MatchBox
            label="Finale"
            team1={getFinalTeam(data, 0)}
            team2={getFinalTeam(data, 1)}
            winner={data.final}
            onPick={side => pickFinal(side)}
            size="lg"
          />
          {champion && (
            <div className="flex flex-col items-center gap-2 mt-4 p-6 bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 rounded-2xl border border-yellow-200 dark:border-yellow-600/50 shadow-lg">
              <Trophy className="text-yellow-500" size={32} />
              <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Champion du Monde 2026</p>
              <p className="text-3xl font-black text-yellow-800 dark:text-yellow-200">
                {champion.flag} {champion.name}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Save floating hint */}
      {dirty && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-40">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all text-sm font-medium"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={15} />
            )}
            Sauvegarder
          </button>
        </div>
      )}
    </div>
  )
}
