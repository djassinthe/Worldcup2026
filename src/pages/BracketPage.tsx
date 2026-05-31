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

// ─── TeamChip ─────────────────────────────────────────────────────────────────

function TeamChip({ team, selected, disabled, onClick }: {
  team: Team | null; selected?: boolean; disabled?: boolean; onClick?: () => void
}) {
  if (!team) return (
    <div className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-gray-300 text-gray-400 text-[13px] italic min-w-[148px]">
      <span>À déterminer</span>
    </div>
  )
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex items-center gap-2 px-3 py-2.5 text-[13px] font-medium transition-colors min-w-[148px] text-left w-full
        ${selected
          ? 'bg-[#003087] text-white'
          : disabled
            ? 'bg-white text-gray-400 border border-gray-200 cursor-default'
            : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 cursor-pointer'
        }`}
    >
      <span className="text-sm leading-none">{team.flag}</span>
      <span className="flex-1 truncate">{team.name}</span>
      {selected && <Check size={12} className="ml-auto shrink-0" strokeWidth={3} />}
    </button>
  )
}

// ─── MatchBox ─────────────────────────────────────────────────────────────────

function MatchBox({ label, team1, team2, winner, onPick, size = 'md' }: {
  label?: string; team1: Team | null; team2: Team | null
  winner: 0 | 1 | null; onPick: (side: 0 | 1) => void; size?: 'sm' | 'md' | 'lg'
}) {
  const canPick = team1 && team2
  const width = size === 'lg' ? 'min-w-[200px]' : size === 'sm' ? 'min-w-[140px]' : 'min-w-[164px]'
  return (
    <div className={`flex flex-col ${width}`}>
      {label && <p className="text-[11px] text-gray-500 mb-1.5 font-semibold uppercase tracking-wider">{label}</p>}
      <div className="border border-gray-200 divide-y divide-gray-200 shadow-sm">
        <TeamChip team={team1} selected={winner === 0} disabled={!canPick} onClick={canPick ? () => onPick(0) : undefined} />
        <TeamChip team={team2} selected={winner === 1} disabled={!canPick} onClick={canPick ? () => onPick(1) : undefined} />
      </div>
    </div>
  )
}

// ─── GroupCard ────────────────────────────────────────────────────────────────

function GroupCard({ group, qualified, onChange }: {
  group: string; qualified: [number, number]; onChange: (q: [number, number]) => void
}) {
  const teams = GROUP_TEAMS[group]
  function toggle(idx: number) {
    const [first, second] = qualified
    if (idx === first) return
    if (idx === second) { onChange([second, first]); return }
    onChange([first, idx])
  }
  return (
    <div className="border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-2.5 bg-[#003087] flex items-center justify-between">
        <span className="font-condensed text-[13px] font-700 uppercase tracking-[0.12em] text-white">
          Groupe {group}
        </span>
        <span className="text-[11px] font-bold text-white/50">1 / 2</span>
      </div>
      <div className="divide-y divide-gray-100">
        {teams.map((team: Team, idx: number) => {
          const rank = idx === qualified[0] ? 1 : idx === qualified[1] ? 2 : null
          return (
            <button key={idx} onClick={() => toggle(idx)}
              className={`w-full flex items-center gap-2.5 px-4 py-3 text-[13px] text-left transition-colors
                ${rank === 1 ? 'bg-[#003087] text-white font-semibold'
                  : rank === 2 ? 'bg-[#e8eef8] text-[#003087] font-medium'
                  : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              <span className="text-base leading-none shrink-0">{team.flag}</span>
              <span className="flex-1 min-w-0 truncate">{team.name}</span>
              {rank && <span className={`text-[11px] font-bold shrink-0 ${rank === 1 ? 'text-white/60' : 'text-[#003087]/40'}`}>{rank}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Tabs config ──────────────────────────────────────────────────────────────

const TABS = [
  { id: 'groupes', label: 'Groupes' },
  { id: 'huitiemes', label: '1/8 de finale' },
  { id: 'quarts', label: 'Quarts' },
  { id: 'demis', label: 'Demi-finales' },
  { id: 'finale', label: 'Finale' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

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
    ;(supabase as any).from('bracket_predictions').select('data').eq('player_id', player.id).maybeSingle()
      .then(({ data: row }: { data: { data: BracketData } | null }) => {
        if (row?.data) setData({ ...DEFAULT_DATA, ...(row.data as BracketData) })
        setLoaded(true)
      })
  }, [player])

  function update(fn: (d: BracketData) => BracketData) { setData(prev => fn({ ...prev })); setDirty(true) }

  function setGroupQualified(group: string, q: [number, number]) {
    update(d => ({ ...d, groupQualified: { ...d.groupQualified, [group]: q }, r16: Array(8).fill(null), quarters: Array(4).fill(null), semis: Array(2).fill(null), final: null, thirdPlace: null }))
  }
  function pickR16(i: number, side: 0 | 1) {
    update(d => { const r = [...d.r16] as (0|1|null)[]; r[i] = side; return { ...d, r16: r, quarters: Array(4).fill(null), semis: Array(2).fill(null), final: null, thirdPlace: null } })
  }
  function pickQuarter(i: number, side: 0 | 1) {
    update(d => { const q = [...d.quarters] as (0|1|null)[]; q[i] = side; return { ...d, quarters: q, semis: Array(2).fill(null), final: null, thirdPlace: null } })
  }
  function pickSemi(i: number, side: 0 | 1) {
    update(d => { const s = [...d.semis] as (0|1|null)[]; s[i] = side; return { ...d, semis: s, final: null, thirdPlace: null } })
  }
  function pickFinal(side: 0 | 1) { update(d => ({ ...d, final: side })) }
  function pickThirdPlace(side: 0 | 1) { update(d => ({ ...d, thirdPlace: side })) }

  async function save() {
    if (!player) return
    setSaving(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('bracket_predictions')
      .upsert({ player_id: player.id, data, updated_at: new Date().toISOString() }, { onConflict: 'player_id' })
    setSaving(false)
    if (error) toast.error('Erreur de sauvegarde')
    else { toast.success('Enregistré !'); setDirty(false) }
  }

  if (!loaded) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="w-5 h-5 border-2 border-[#003087] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const champion = getChampion(data)
  const loser0 = getSemiLoser(data, 0)
  const loser1 = getSemiLoser(data, 1)

  return (
    <div className="max-w-5xl mx-auto">

      {/* Hero band */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 md:px-6 py-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-[32px] font-800 text-[#003087] tracking-tight leading-none">
              Mon Bracket
            </h1>
            <p className="text-[13px] text-gray-400 mt-2 font-medium">
              Coupe du Monde FIFA 2026
            </p>
          </div>
          {champion && (
            <div className="hidden sm:flex items-center gap-3 bg-[#f5a623]/10 border border-[#f5a623]/30 px-4 py-2.5">
              <span className="text-xl">{champion.flag}</span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">Mon champion</p>
                <p className="text-[14px] font-bold text-[#111827]">{champion.name}</p>
              </div>
              <span className="text-[#f5a623] text-xl ml-1">🏆</span>
            </div>
          )}
        </div>

        {/* Tabs + Save button — save is absolutely positioned to the right */}
        <div className="relative border-t border-gray-100">
          <div className="px-4 md:px-6 flex items-end overflow-x-auto scrollbar-hide" style={{paddingRight: '160px'}}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`relative px-5 pb-4 pt-3 text-[12px] font-bold tracking-[0.08em] uppercase whitespace-nowrap transition-colors shrink-0
                  ${tab === t.id ? 'text-[#003087]' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {t.label}
                {tab === t.id && <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#003087]" />}
              </button>
            ))}
          </div>
          {/* Save button — always pinned to the right, outside the scroll area */}
          <div className="absolute right-0 top-0 bottom-0 flex items-center px-4 md:px-6 bg-white border-l border-gray-100">
            <button onClick={save} disabled={!dirty || saving}
              className={`text-[12px] font-bold uppercase tracking-[0.08em] px-4 py-2 transition-colors whitespace-nowrap
                ${dirty
                  ? 'bg-[#c8102e] text-white hover:bg-[#a00d25]'
                  : 'text-gray-300 cursor-default'}`}
            >
              {saving ? 'Enregistrement…' : dirty ? '● Enregistrer' : '✓ Enregistré'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-6 py-8">

        {tab === 'groupes' && (
          <div>
            <p className="text-[13px] text-gray-400 mb-7">
              Sélectionne les 2 équipes qualifiées de chaque groupe. Clique une 3e équipe pour remplacer le 2e qualifié — clique le 2e pour l'échanger avec le 1er.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {GROUPS.map(g => (
                <GroupCard key={g} group={g} qualified={data.groupQualified[g] as [number, number]} onChange={q => setGroupQualified(g, q)} />
              ))}
            </div>
          </div>
        )}

        {tab === 'huitiemes' && (
          <div>
            <p className="text-[13px] text-gray-400 mb-7">Sélectionne le vainqueur de chaque 1/8 de finale.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-8">
              {EIGHTFINALS.map((m, i) => (
                <MatchBox key={i} label={`Match ${i + 1}`}
                  team1={getGroupTeam(data, m.t1.g, m.t1.rank as 1|2)}
                  team2={getGroupTeam(data, m.t2.g, m.t2.rank as 1|2)}
                  winner={data.r16[i]} onPick={side => pickR16(i, side)} />
              ))}
            </div>
          </div>
        )}

        {tab === 'quarts' && (
          <div>
            <p className="text-[13px] text-gray-400 mb-7">Sélectionne le vainqueur de chaque quart de finale.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-8">
              {Array.from({ length: 4 }, (_, i) => (
                <MatchBox key={i} label={`Quart ${i + 1}`}
                  team1={getQuarterTeam(data, i, 0)} team2={getQuarterTeam(data, i, 1)}
                  winner={data.quarters[i]} onPick={side => pickQuarter(i, side)} size="lg" />
              ))}
            </div>
          </div>
        )}

        {tab === 'demis' && (
          <div className="space-y-10">
            <div>
              <p className="text-[13px] text-gray-400 mb-7">Sélectionne les finalistes. Les perdants jouent la 3e place.</p>
              <div className="flex flex-wrap gap-10">
                {Array.from({ length: 2 }, (_, i) => (
                  <MatchBox key={i} label={`Demi-finale ${i + 1}`}
                    team1={getSemiTeam(data, i, 0)} team2={getSemiTeam(data, i, 1)}
                    winner={data.semis[i]} onPick={side => pickSemi(i, side)} size="lg" />
                ))}
              </div>
            </div>
            {loser0 && loser1 && (
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold mb-3">Match pour la 3e place</p>
                <MatchBox team1={loser0} team2={loser1} winner={data.thirdPlace} onPick={side => pickThirdPlace(side)} size="lg" />
              </div>
            )}
          </div>
        )}

        {tab === 'finale' && (
          <div className="space-y-10">
            <div>
              <p className="text-[13px] text-gray-400 mb-7">Qui soulève la Coupe du Monde ?</p>
              <MatchBox label="Grande Finale · 19 juillet 2026"
                team1={getFinalTeam(data, 0)} team2={getFinalTeam(data, 1)}
                winner={data.final} onPick={side => pickFinal(side)} size="lg" />
            </div>
            {champion && (
              <div className="inline-flex items-center gap-4 bg-[#f5a623]/10 border-2 border-[#f5a623] px-6 py-4">
                <span className="text-3xl">{champion.flag}</span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[#9ca3af]">Mon champion 2026</p>
                  <p className="text-[22px] font-condensed font-700 uppercase text-[#111827] tracking-wide">{champion.name}</p>
                </div>
                <span className="text-3xl">🏆</span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
