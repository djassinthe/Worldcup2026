import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  type BracketData,
  type Team,
  GROUP_TEAMS,
  GROUPS,
  EIGHTFINALS,
  DEFAULT_DATA,
  getGroupTeam,
  getQuarterTeam,
  getSemiTeam,
  getSemiLoser,
  getFinalTeam,
  getChampion,
} from '../utils/bracketData'

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
      <div className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 dark:border-[#5f6368] text-[#5f6368] dark:text-[#9aa0a6] text-[13px] italic min-w-[148px]">
        <span className="opacity-30 text-sm">—</span>
        <span>À déterminer</span>
      </div>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-3 py-2 text-[13px] font-medium transition-colors min-w-[148px] text-left w-full
        ${selected
          ? 'bg-[#1a73e8] dark:bg-[#8ab4f8] text-white dark:text-[#202124]'
          : disabled
            ? 'bg-white dark:bg-[#292a2d] text-[#5f6368] dark:text-[#9aa0a6] border border-gray-200 dark:border-[#3c4043] cursor-default'
            : 'bg-white dark:bg-[#292a2d] text-gray-900 dark:text-[#e8eaed] border border-gray-200 dark:border-[#3c4043] hover:bg-gray-50 dark:hover:bg-[#35363a] cursor-pointer'
        }`}
    >
      <span className="text-sm leading-none">{team.flag}</span>
      <span className="flex-1 truncate">{team.name}</span>
      {selected && <Check size={12} className="ml-auto shrink-0" strokeWidth={3} />}
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
  const width = size === 'lg' ? 'min-w-[200px]' : size === 'sm' ? 'min-w-[140px]' : 'min-w-[164px]'

  return (
    <div className={`flex flex-col ${width}`}>
      {label && (
        <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] mb-1.5 font-medium">
          {label}
        </p>
      )}
      <div className="border border-gray-200 dark:border-[#3c4043] divide-y divide-gray-200 dark:divide-[#3c4043]">
        <TeamChip
          team={team1}
          selected={winner === 0}
          disabled={!canPick}
          onClick={canPick ? () => onPick(0) : undefined}
        />
        <TeamChip
          team={team2}
          selected={winner === 1}
          disabled={!canPick}
          onClick={canPick ? () => onPick(1) : undefined}
        />
      </div>
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
    if (idx === first) return // déjà 1er, rien à faire
    if (idx === second) {
      onChange([second, first]) // promouvoir le 2e en 1er
      return
    }
    // équipe non qualifiée → remplace le 2e, le 1er reste inchangé
    onChange([first, idx])
  }

  return (
    <div className="border border-gray-200 dark:border-[#3c4043]">
      <div className="px-3 py-2 border-b border-gray-200 dark:border-[#3c4043] bg-gray-50 dark:bg-[#292a2d] flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#5f6368] dark:text-[#9aa0a6]">
          Groupe {group}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-[#1a73e8] dark:text-[#8ab4f8] font-bold">1</span>
          <span className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6]">/</span>
          <span className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6] font-medium">2</span>
        </div>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-[#3c4043]">
        {teams.map((team, idx) => {
          const rank = idx === qualified[0] ? 1 : idx === qualified[1] ? 2 : null
          return (
            <button
              key={idx}
              onClick={() => toggle(idx)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] text-left transition-colors
                ${rank === 1
                  ? 'bg-[#1a73e8] dark:bg-[#8ab4f8] text-white dark:text-[#202124] font-semibold'
                  : rank === 2
                    ? 'bg-[#e8f0fe] dark:bg-[#1e3a5f]/60 text-[#1a73e8] dark:text-[#8ab4f8] font-medium'
                    : 'bg-white dark:bg-[#202124] text-gray-700 dark:text-[#bdc1c6] hover:bg-gray-50 dark:hover:bg-[#292a2d]'
                }`}
            >
              <span className="text-sm leading-none">{team.flag}</span>
              <span className="flex-1 truncate">{team.name}</span>
              {rank !== null && (
                <span className={`text-[11px] font-bold ml-auto
                  ${rank === 1 ? 'text-white/70 dark:text-[#202124]/70' : 'text-[#1a73e8]/60 dark:text-[#8ab4f8]/60'}`}>
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
  { id: 'huitiemes', label: '1/8 de finale' },
  { id: 'quarts', label: 'Quarts' },
  { id: 'demis', label: 'Demi-finales' },
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

  useEffect(() => {
    if (!player) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any)
      .from('bracket_predictions')
      .select('data')
      .eq('player_id', player.id)
      .maybeSingle()
      .then(({ data: row }: { data: { data: BracketData } | null }) => {
        if (row?.data) setData({ ...DEFAULT_DATA, ...(row.data as BracketData) })
        setLoaded(true)
      })
  }, [player])

  function update(fn: (d: BracketData) => BracketData) {
    setData(prev => fn({ ...prev }))
    setDirty(true)
  }

  function setGroupQualified(group: string, q: [number, number]) {
    update(d => ({
      ...d,
      groupQualified: { ...d.groupQualified, [group]: q },
      r16: Array(8).fill(null),
      quarters: Array(4).fill(null),
      semis: Array(2).fill(null),
      final: null,
      thirdPlace: null,
    }))
  }

  function pickR16(matchIdx: number, side: 0 | 1) {
    update(d => {
      const newR16 = [...d.r16] as (0 | 1 | null)[]
      newR16[matchIdx] = side
      return { ...d, r16: newR16, quarters: Array(4).fill(null), semis: Array(2).fill(null), final: null, thirdPlace: null }
    })
  }

  function pickQuarter(matchIdx: number, side: 0 | 1) {
    update(d => {
      const newQ = [...d.quarters] as (0 | 1 | null)[]
      newQ[matchIdx] = side
      return { ...d, quarters: newQ, semis: Array(2).fill(null), final: null, thirdPlace: null }
    })
  }

  function pickSemi(matchIdx: number, side: 0 | 1) {
    update(d => {
      const newS = [...d.semis] as (0 | 1 | null)[]
      newS[matchIdx] = side
      return { ...d, semis: newS, final: null, thirdPlace: null }
    })
  }

  function pickFinal(side: 0 | 1) { update(d => ({ ...d, final: side })) }
  function pickThirdPlace(side: 0 | 1) { update(d => ({ ...d, thirdPlace: side })) }

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
      toast.success('Enregistré')
      setDirty(false)
    }
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-5 h-5 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const champion = getChampion(data)
  const thirdPlaceLoser0 = getSemiLoser(data, 0)
  const thirdPlaceLoser1 = getSemiLoser(data, 1)

  return (
    <div className="max-w-5xl mx-auto">
      {/* ── Header ── */}
      <div className="px-4 md:px-6 pt-6 pb-0 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-normal text-gray-900 dark:text-[#e8eaed] leading-tight">
            Mon bracket
          </h1>
          <p className="text-[13px] text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">
            Coupe du Monde FIFA 2026 · Phase éliminatoire
          </p>
        </div>

        {/* Champion callout */}
        {champion ? (
          <div className="hidden sm:flex flex-col items-end">
            <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide font-medium">Mon champion</p>
            <p className="text-[15px] font-medium text-gray-900 dark:text-[#e8eaed] mt-0.5">
              {champion.flag} {champion.name}
            </p>
          </div>
        ) : (
          <div className="hidden sm:block" />
        )}
      </div>

      {/* ── Tabs (style Google underline) ── */}
      <div className="px-4 md:px-6 mt-4 border-b border-gray-200 dark:border-[#3c4043] flex items-end gap-0 overflow-x-auto scrollbar-hide">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative px-4 pb-3 pt-1 text-[13px] font-medium whitespace-nowrap transition-colors shrink-0
              ${tab === t.id
                ? 'text-[#1a73e8] dark:text-[#8ab4f8]'
                : 'text-[#5f6368] dark:text-[#9aa0a6] hover:text-gray-800 dark:hover:text-[#e8eaed] hover:bg-gray-50 dark:hover:bg-[#2d2e30]'
              }`}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1a73e8] dark:bg-[#8ab4f8]" />
            )}
          </button>
        ))}

        {/* Save action dans les tabs */}
        <div className="ml-auto pb-2 pt-1 shrink-0 flex items-center">
          <button
            onClick={save}
            disabled={!dirty || saving}
            className={`text-[13px] font-medium px-3 py-1.5 transition-colors
              ${dirty
                ? 'text-[#1a73e8] dark:text-[#8ab4f8] hover:bg-[#e8f0fe] dark:hover:bg-[#1e3a5f]/30'
                : 'text-[#bdc1c6] dark:text-[#5f6368] cursor-default'
              }`}
          >
            {saving ? 'Enregistrement…' : dirty ? 'Enregistrer' : 'Enregistré'}
          </button>
        </div>
      </div>

      {/* ── Contenu de l'onglet ── */}
      <div className="px-4 md:px-6 py-6">

        {/* GROUPES */}
        {tab === 'groupes' && (
          <div>
            <p className="text-[13px] text-[#5f6368] dark:text-[#9aa0a6] mb-5">
              Sélectionne les 2 équipes qui se qualifient de chaque groupe. Le 1<sup>er</sup> avance directement en 1/8, le 2<sup>ème</sup> aussi selon le tirage.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-gray-200 dark:bg-[#3c4043]">
              {GROUPS.map(g => (
                <div key={g} className="bg-white dark:bg-[#202124]">
                  <GroupCard
                    group={g}
                    qualified={data.groupQualified[g] as [number, number]}
                    onChange={q => setGroupQualified(g, q)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 1/8 DE FINALE */}
        {tab === 'huitiemes' && (
          <div>
            <p className="text-[13px] text-[#5f6368] dark:text-[#9aa0a6] mb-5">
              Sélectionne le gagnant de chaque match. Les équipes sont issues de tes choix dans les groupes.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-6">
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

        {/* QUARTS */}
        {tab === 'quarts' && (
          <div>
            <p className="text-[13px] text-[#5f6368] dark:text-[#9aa0a6] mb-5">
              Les gagnants des 1/8 s'affrontent en quarts de finale.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-6">
              {Array.from({ length: 4 }, (_, i) => (
                <MatchBox
                  key={i}
                  label={`Quart de finale ${i + 1}`}
                  team1={getQuarterTeam(data, i, 0)}
                  team2={getQuarterTeam(data, i, 1)}
                  winner={data.quarters[i]}
                  onPick={side => pickQuarter(i, side)}
                  size="lg"
                />
              ))}
            </div>
          </div>
        )}

        {/* DEMI-FINALES */}
        {tab === 'demis' && (
          <div className="space-y-8">
            <div>
              <p className="text-[13px] text-[#5f6368] dark:text-[#9aa0a6] mb-5">
                Deux demi-finales — les perdants joueront pour la 3e place.
              </p>
              <div className="flex flex-wrap gap-8">
                {Array.from({ length: 2 }, (_, i) => (
                  <MatchBox
                    key={i}
                    label={`Demi-finale ${i + 1}`}
                    team1={getSemiTeam(data, i, 0)}
                    team2={getSemiTeam(data, i, 1)}
                    winner={data.semis[i]}
                    onPick={side => pickSemi(i, side)}
                    size="lg"
                  />
                ))}
              </div>
            </div>

            {thirdPlaceLoser0 && thirdPlaceLoser1 && (
              <div>
                <p className="text-[12px] text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide font-medium mb-3">
                  Match pour la 3e place
                </p>
                <MatchBox
                  team1={thirdPlaceLoser0}
                  team2={thirdPlaceLoser1}
                  winner={data.thirdPlace}
                  onPick={side => pickThirdPlace(side)}
                  size="lg"
                />
              </div>
            )}
          </div>
        )}

        {/* FINALE */}
        {tab === 'finale' && (
          <div className="flex flex-col items-start gap-8">
            <div>
              <p className="text-[13px] text-[#5f6368] dark:text-[#9aa0a6] mb-5">
                Grande finale — Qui soulève la Coupe du Monde ?
              </p>
              <MatchBox
                label="Finale · 19 juillet 2026"
                team1={getFinalTeam(data, 0)}
                team2={getFinalTeam(data, 1)}
                winner={data.final}
                onPick={side => pickFinal(side)}
                size="lg"
              />
            </div>

            {champion && (
              <div className="border-l-[3px] border-[#1a73e8] dark:border-[#8ab4f8] pl-4 py-1">
                <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide font-medium mb-1">
                  Champion du Monde 2026
                </p>
                <p className="text-[22px] font-medium text-gray-900 dark:text-[#e8eaed]">
                  {champion.flag} {champion.name}
                </p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Mobile champion */}
      {champion && (
        <div className="sm:hidden px-4 pb-20 -mt-2">
          <div className="border-l-[3px] border-[#1a73e8] dark:border-[#8ab4f8] pl-3 py-0.5">
            <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide">Mon champion</p>
            <p className="text-[15px] font-medium text-gray-900 dark:text-[#e8eaed]">{champion.flag} {champion.name}</p>
          </div>
        </div>
      )}
    </div>
  )
}

