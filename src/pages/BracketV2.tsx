import { useState, useEffect, type ReactNode } from 'react'
import { Check, Trophy, CalendarDays, Crown, ListChecks } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  type BracketData,
  type Team,
  GROUP_TEAMS,
  GROUPS,
  R32_MATCHES,
  type R32GroupMatch,
  type R32ThirdMatch,
  DEFAULT_DATA,
  migrateData,
  getR32Team,
  getR16Team,
  getQuarterTeam,
  getSemiTeam,
  getSemiLoser,
  getFinalTeam,
  getChampion,
} from '../utils/bracketData'

// ════════════════════════════════════════════════════════════════════════════
//  BracketV2 — bracket editor reskinned with the ClassementV2 visual system.
//  Route: /bracket-v2. ALL game logic is identical to BracketPage.
// ════════════════════════════════════════════════════════════════════════════

function daysUntil(d: string) { return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)) }
const T_START = '2026-06-11'

// ─── Stat (identical to ClassementV2) ───────────────────────────────────────────

function Stat({ icon, value, label, gold = false }: { icon: ReactNode; value: ReactNode; label: string; gold?: boolean }) {
  return (
    <div className="flex flex-1 items-center gap-3 px-5 py-2">
      <span className={`flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-xl ${gold ? 'bg-gradient-to-br from-amber-100 to-amber-50 text-brand-gold shadow-[0_4px_12px_rgba(245,166,35,0.22)]' : 'bg-gradient-to-br from-[#eef2f8] to-[#f7f9fc] text-brand-navy'}`}>{icon}</span>
      <div className="min-w-0">
        <p className="font-condensed text-[40px] font-800 leading-none text-gray-900">{value}</p>
        <p className="mt-1 text-[11px] font-700 uppercase leading-tight tracking-[0.05em] text-gray-400">{label}</p>
      </div>
    </div>
  )
}

// ─── TeamChip (reskinned, same behaviour) ───────────────────────────────────────

function TeamChip({ team, selected, disabled, onClick }: {
  team: Team | null; selected?: boolean; disabled?: boolean; onClick?: () => void
}) {
  if (!team) return (
    <div className="flex min-w-[148px] items-center gap-2 px-3.5 py-3 text-[13px] italic text-gray-300">
      <span>À déterminer</span>
    </div>
  )
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex w-full min-w-[148px] items-center gap-2 px-3.5 py-3 text-left text-[13px] font-600 transition-colors
        ${selected
          ? 'bg-gradient-to-r from-[#0a3f9e] to-brand-navy text-white'
          : disabled
            ? 'cursor-default bg-white text-gray-400'
            : 'cursor-pointer bg-white text-gray-900 hover:bg-[#f4f6fa]'
        }`}
    >
      <span className="text-sm leading-none">{team.flag}</span>
      <span className="flex-1 truncate">{team.name}</span>
      {selected && <Check size={13} className="ml-auto shrink-0" strokeWidth={3} />}
    </button>
  )
}

// ─── MatchBox (reskinned, same behaviour) ───────────────────────────────────────

function MatchBox({ label, team1, team2, winner, onPick, size = 'md' }: {
  label?: string; team1: Team | null; team2: Team | null
  winner: 0 | 1 | null; onPick: (side: 0 | 1) => void; size?: 'sm' | 'md' | 'lg'
}) {
  const canPick = team1 && team2
  const width = size === 'lg' ? 'min-w-[200px]' : size === 'sm' ? 'min-w-[140px]' : 'min-w-[164px]'
  return (
    <div className={`flex flex-col ${width}`}>
      {label && <p className="mb-1.5 text-[11px] font-700 uppercase tracking-[0.08em] text-gray-400">{label}</p>}
      <div className="divide-y divide-gray-100 overflow-hidden rounded-[14px] border border-gray-200 shadow-[0_4px_14px_rgba(20,30,60,0.06)]">
        <TeamChip team={team1} selected={winner === 0} disabled={!canPick} onClick={canPick ? () => onPick(0) : undefined} />
        <TeamChip team={team2} selected={winner === 1} disabled={!canPick} onClick={canPick ? () => onPick(1) : undefined} />
      </div>
    </div>
  )
}

// ─── GroupCard (reskinned, same phase logic) ────────────────────────────────────

function GroupCard({ group, qualified, onChange }: {
  group: string
  qualified: [number, number, number]
  onChange: (q: [number, number, number]) => void
}) {
  const teams = GROUP_TEAMS[group]
  const [phase, setPhase] = useState<1 | 2 | 3>(1)

  function handleClick(idx: number) {
    if (phase === 1) {
      onChange([idx, -1, -1])
      setPhase(2)
    } else if (phase === 2) {
      if (idx === qualified[0]) return
      onChange([qualified[0], idx, -1])
      setPhase(3)
    } else {
      if (idx === qualified[0] || idx === qualified[1]) return
      onChange([qualified[0], qualified[1], idx])
      setPhase(1)
    }
  }

  const phaseLabel = phase === 1 ? '→ 1er' : phase === 2 ? '→ 2e' : '→ 3e'
  const phaseCls = phase === 1 ? 'text-white/50' : phase === 2 ? 'bg-brand-gold text-brand-navy' : 'bg-white/20 text-white'

  return (
    <div className="overflow-hidden rounded-[18px] border border-white/70 bg-white shadow-[0_8px_24px_rgba(20,30,60,0.08),0_1px_3px_rgba(20,30,60,0.06)]">
      <div className="flex items-center justify-between bg-gradient-to-r from-[#0a3f9e] to-brand-navy px-4 py-2.5">
        <span className="font-condensed text-[14px] font-700 uppercase tracking-[0.12em] text-white">Groupe {group}</span>
        <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-700 ${phaseCls}`}>{phaseLabel}</span>
      </div>
      <div className="divide-y divide-gray-100">
        {teams.map((team: Team, idx: number) => {
          const rank = idx === qualified[0] ? 1 : idx === qualified[1] ? 2 : idx === qualified[2] ? 3 : null
          return (
            <button key={idx} onClick={() => handleClick(idx)}
              className={`flex w-full items-center gap-2.5 px-4 py-3 text-left text-[13px] transition-colors
                ${rank === 1 ? 'bg-gradient-to-r from-[#0a3f9e] to-brand-navy font-600 text-white'
                  : rank === 2 ? 'bg-[#e8eef8] font-600 text-brand-navy'
                  : rank === 3 ? 'bg-[#f4f6fa] text-gray-500'
                  : 'bg-white text-gray-700 hover:bg-[#f7f9fb]'}`}
            >
              <span className="shrink-0 text-base leading-none">{team.flag}</span>
              <span className="min-w-0 flex-1 truncate">{team.name}</span>
              {rank && (
                <span className={`shrink-0 text-[11px] font-700 ${rank === 1 ? 'text-white/60' : rank === 2 ? 'text-brand-navy/40' : 'text-gray-400'}`}>
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

// ─── BestThirdsCard (reskinned, same selection logic) ────────────────────────────

function BestThirdsCard({ data, onChange }: {
  data: BracketData
  onChange: (groups: string[]) => void
}) {
  const selected = new Set(data.bestThirds)
  const count = selected.size

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-[14px] leading-relaxed text-gray-500">
          Sélectionne les <strong className="text-gray-900">8 meilleures 3es équipes</strong> sur 12 qui se qualifient pour les seizièmes.
        </p>
        <span className={`font-condensed ml-4 flex h-9 min-w-[64px] shrink-0 items-center justify-center rounded-lg px-2.5 text-[20px] font-800 ${count === 8 ? 'bg-green-100 text-green-700' : 'bg-[#fdecec] text-brand-red'}`}>
          {count} / 8
        </span>
      </div>
      {count < 8 && (
        <div className="mb-4 rounded-xl border-l-2 border-brand-gold bg-[#fff8e6] px-4 py-3 text-[13px] text-[#92400e]">
          Remplis d'abord tous les groupes jusqu'au 3e, puis sélectionne les 8 meilleures 3es.
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {GROUPS.map(g => {
          const q = data.groupQualified[g]
          const thirdIdx = q?.[2]
          const thirdTeam = thirdIdx !== undefined && thirdIdx !== -1 ? GROUP_TEAMS[g][thirdIdx] : null
          const isSelected = selected.has(g)
          const canAdd = !isSelected && count < 8 && !!thirdTeam

          return (
            <button
              key={g}
              onClick={() => {
                if (isSelected) onChange(data.bestThirds.filter(x => x !== g))
                else if (canAdd) onChange([...data.bestThirds, g].sort())
              }}
              disabled={!thirdTeam}
              className={`flex items-center gap-2 rounded-[14px] border px-3.5 py-3 text-left text-[13px] transition-colors
                ${!thirdTeam
                  ? 'cursor-not-allowed border-dashed border-gray-200 bg-white text-gray-400 opacity-40'
                  : isSelected
                    ? 'border-transparent bg-gradient-to-r from-[#0a3f9e] to-brand-navy text-white shadow-[0_4px_14px_rgba(0,48,135,0.22)]'
                    : canAdd
                      ? 'cursor-pointer border-gray-200 bg-white text-gray-700 hover:bg-[#f4f6fa]'
                      : 'cursor-not-allowed border-gray-100 bg-white text-gray-200'
                }`}
            >
              <span className={`font-condensed shrink-0 text-[11px] font-700 uppercase tracking-widest ${isSelected ? 'text-white/60' : 'text-gray-400'}`}>
                Gr.{g}
              </span>
              {thirdTeam ? (
                <>
                  <span className="shrink-0 text-sm">{thirdTeam.flag}</span>
                  <span className="flex-1 truncate font-600">{thirdTeam.name}</span>
                  {isSelected && <Check size={12} className="shrink-0" strokeWidth={3} />}
                </>
              ) : (
                <span className="flex-1 text-[12px] italic text-gray-300">3e non sélectionné</span>
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
  { id: 'groupes',    label: 'Groupes' },
  { id: 'meilleurs3', label: 'Meilleurs 3es' },
  { id: 'seiziemes',  label: 'Seizièmes' },
  { id: 'huitiemes',  label: 'Huitièmes' },
  { id: 'quarts',     label: 'Quarts' },
  { id: 'demis',      label: 'Demi-finales' },
  { id: 'finale',     label: 'Finale' },
]

// ════════════════════════════════════════════════════════════════════════════
//  Page
// ════════════════════════════════════════════════════════════════════════════

export default function BracketV2() {
  const { player } = useAuth()
  const [tab, setTab] = useState('groupes')
  const [data, setData] = useState<BracketData>(DEFAULT_DATA)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const days = daysUntil(T_START)

  useEffect(() => {
    if (!player) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any).from('bracket_predictions').select('data').eq('player_id', player.id).maybeSingle()
      .then(({ data: row }: { data: { data: unknown } | null }) => {
        if (row?.data) setData(migrateData(row.data))
        setLoaded(true)
      })
  }, [player])

  function update(fn: (d: BracketData) => BracketData) { setData(prev => fn({ ...prev })); setDirty(true) }

  const RESET_ELIM = { r32: Array(16).fill(null), r16: Array(8).fill(null), quarters: Array(4).fill(null), semis: Array(2).fill(null), final: null, thirdPlace: null }

  function setGroupQualified(group: string, q: [number, number, number]) {
    update(d => ({ ...d, groupQualified: { ...d.groupQualified, [group]: q }, ...RESET_ELIM }))
  }
  function setBestThirds(groups: string[]) {
    update(d => ({ ...d, bestThirds: groups, ...RESET_ELIM }))
  }
  function pickR32(i: number, side: 0 | 1) {
    update(d => { const r = [...d.r32] as (0 | 1 | null)[]; r[i] = side; return { ...d, r32: r, r16: Array(8).fill(null), quarters: Array(4).fill(null), semis: Array(2).fill(null), final: null, thirdPlace: null } })
  }
  function pickR16(i: number, side: 0 | 1) {
    update(d => { const r = [...d.r16] as (0 | 1 | null)[]; r[i] = side; return { ...d, r16: r, quarters: Array(4).fill(null), semis: Array(2).fill(null), final: null, thirdPlace: null } })
  }
  function pickQuarter(i: number, side: 0 | 1) {
    update(d => { const q = [...d.quarters] as (0 | 1 | null)[]; q[i] = side; return { ...d, quarters: q, semis: Array(2).fill(null), final: null, thirdPlace: null } })
  }
  function pickSemi(i: number, side: 0 | 1) {
    update(d => { const s = [...d.semis] as (0 | 1 | null)[]; s[i] = side; return { ...d, semis: s, final: null, thirdPlace: null } })
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
    <div className="flex min-h-64 items-center justify-center">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand-navy border-t-transparent" />
    </div>
  )

  const champion = getChampion(data)
  const loser0 = getSemiLoser(data, 0)
  const loser1 = getSemiLoser(data, 1)

  return (
    <div className="min-h-full w-full px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-[1280px]">

        {/* ── HEADER CARD ─────────────────────────────────────────────── */}
        <div className="relative flex flex-col gap-8 overflow-hidden rounded-[28px] border border-white/60 bg-gradient-to-br from-white via-white to-[#eef3fb] px-7 py-8 shadow-[0_14px_44px_rgba(20,30,60,0.10),0_2px_6px_rgba(20,30,60,0.05)] md:px-11 md:py-11 lg:flex-row lg:items-center lg:justify-between" style={{ zoom: 0.8 }}>
          <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(245,166,35,0.16)_0%,transparent_70%)]" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(0,48,135,0.07)_0%,transparent_70%)]" />
          <div className="relative min-w-0">
            <p className="mb-2 inline-flex items-center gap-2 text-[14px] font-700 uppercase tracking-[0.24em] text-brand-navy">
              <Trophy size={16} className="text-brand-gold" /> FIFA World Cup 2026
            </p>
            <h1 className="font-condensed bg-gradient-to-br from-gray-900 to-[#1f3a6e] bg-clip-text text-[46px] font-800 uppercase leading-[0.9] tracking-[0.01em] text-transparent sm:text-[64px] md:text-[76px]">Mon Bracket</h1>
            <p className="mt-3 max-w-lg text-[16px] leading-relaxed text-gray-500">
              Format 48 équipes — remplis tes pronostics phase par phase. Sauvegarde avant le coup d'envoi.
            </p>
          </div>
          <div className="relative flex shrink-0 flex-wrap divide-x divide-gray-200/70 rounded-[20px] border border-white/80 bg-white/70 py-3 shadow-[0_8px_24px_rgba(20,30,60,0.07)] backdrop-blur">
            <Stat icon={<ListChecks size={24} strokeWidth={2} />} value={`${data.bestThirds.length}/8`} label="meilleurs 3es" />
            <Stat icon={<Crown size={24} strokeWidth={2} />} value={champion ? champion.flag : '—'} label="champion" gold />
            <Stat icon={<CalendarDays size={24} strokeWidth={2} />} value={days === 0 ? 'Auj.' : days} label={days === 0 ? 'jour J' : `jour${days > 1 ? 's' : ''} restants`} />
          </div>
        </div>

        {/* ── TAB BAR + SAVE ───────────────────────────────────────────── */}
        <div className="relative mt-6 overflow-hidden rounded-[22px] border border-white/70 bg-white shadow-[0_8px_28px_rgba(20,30,60,0.08),0_1px_3px_rgba(20,30,60,0.06)]">
          <div className="flex items-end overflow-x-auto scrollbar-hide pl-5 pr-[168px]">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`relative shrink-0 whitespace-nowrap px-4 pb-4 pt-4 text-[12px] font-700 uppercase tracking-[0.08em] transition-colors
                  ${tab === t.id ? 'text-brand-navy' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {t.label}
                {tab === t.id && <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-brand-navy" />}
              </button>
            ))}
          </div>
          <div className="absolute bottom-0 right-0 top-0 flex items-center border-l border-gray-100 bg-white px-4 md:px-6">
            <button onClick={save} disabled={!dirty || saving}
              className={`whitespace-nowrap rounded-full px-5 py-2.5 text-[12px] font-700 uppercase tracking-[0.08em] transition-colors
                ${dirty ? 'bg-brand-red text-white shadow-[0_6px_18px_rgba(200,16,46,0.32)] hover:bg-[#a00d25]' : 'text-gray-300'}`}
            >
              {saving ? 'Enregistrement…' : dirty ? '● Enregistrer' : '✓ Enregistré'}
            </button>
          </div>
        </div>

        {/* ── CONTENT ──────────────────────────────────────────────────── */}
        <div className="mt-6 overflow-hidden rounded-[28px] border border-white/60 bg-white px-5 py-7 shadow-[0_18px_50px_rgba(20,30,60,0.10),0_2px_8px_rgba(20,30,60,0.06)] md:px-8 md:py-9">

          {/* ── Groupes ─────────────────────────────────────────────────── */}
          {tab === 'groupes' && (
            <div>
              <p className="mb-7 text-[14px] text-gray-400">
                Clique 3 fois par groupe pour sélectionner le <strong className="text-gray-600">1er</strong>,{' '}
                <strong className="text-gray-600">2e</strong> et <strong className="text-gray-600">3e</strong>.
                Le 3e servira à la sélection des meilleurs 3es.
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {GROUPS.map(g => (
                  <GroupCard key={g} group={g}
                    qualified={data.groupQualified[g] as [number, number, number]}
                    onChange={q => setGroupQualified(g, q)} />
                ))}
              </div>
            </div>
          )}

          {/* ── Meilleurs 3es ───────────────────────────────────────────── */}
          {tab === 'meilleurs3' && (
            <BestThirdsCard data={data} onChange={setBestThirds} />
          )}

          {/* ── Seizièmes (R32) ─────────────────────────────────────────── */}
          {tab === 'seiziemes' && (
            <div className="space-y-10">
              <div>
                <p className="mb-5 text-[11px] font-700 uppercase tracking-widest text-brand-navy">
                  Pairages fixes — 8 matchs
                </p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
                  {([0,2,3,5,10,11,13,15] as const).map(i => {
                    const m = R32_MATCHES[i] as R32GroupMatch
                    const labels = ['M73','M74','M75','M76','M77','M78','M79','M80','M81','M82','M83','M84','M85','M86','M87','M88']
                    const lbl = `${labels[i]} · ${m.t1.rank === 1 ? '1er' : '2e'} ${m.t1.g} vs ${m.t2.rank === 1 ? '1er' : '2e'} ${m.t2.g}`
                    return (
                      <MatchBox key={i} label={lbl}
                        team1={getR32Team(data, i, 0)} team2={getR32Team(data, i, 1)}
                        winner={data.r32[i]} onPick={side => pickR32(i, side)} />
                    )
                  })}
                </div>
              </div>

              {data.bestThirds.length === 8 ? (
                <div>
                  <p className="mb-5 text-[11px] font-700 uppercase tracking-widest text-brand-navy">
                    1ers vs meilleurs 3es — 8 matchs
                  </p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
                    {([1,4,6,7,8,9,12,14] as const).map(i => {
                      const tm = R32_MATCHES[i] as R32ThirdMatch
                      const labels = ['M73','M74','M75','M76','M77','M78','M79','M80','M81','M82','M83','M84','M85','M86','M87','M88']
                      return (
                        <MatchBox key={i} label={`${labels[i]} · 1er ${tm.host.g} vs 3e`}
                          team1={getR32Team(data, i, 0)} team2={getR32Team(data, i, 1)}
                          winner={data.r32[i]} onPick={side => pickR32(i, side)} />
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border-l-2 border-brand-navy bg-[#f4f6fa] px-4 py-3 text-[13px] text-gray-500">
                  Sélectionne les 8 meilleurs 3es dans l'onglet <strong className="text-brand-navy">Meilleurs 3es</strong> pour accéder aux 8 matchs restants.
                </div>
              )}
            </div>
          )}

          {/* ── Huitièmes (R16) ─────────────────────────────────────────── */}
          {tab === 'huitiemes' && (
            <div>
              <p className="mb-7 text-[14px] text-gray-400">Sélectionne le vainqueur de chaque huitième de finale.</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4">
                {Array.from({ length: 8 }, (_, i) => (
                  <MatchBox key={i} label={`Huitième ${i + 1}`}
                    team1={getR16Team(data, i, 0)} team2={getR16Team(data, i, 1)}
                    winner={data.r16[i]} onPick={side => pickR16(i, side)} />
                ))}
              </div>
            </div>
          )}

          {/* ── Quarts ──────────────────────────────────────────────────── */}
          {tab === 'quarts' && (
            <div>
              <p className="mb-7 text-[14px] text-gray-400">Sélectionne le vainqueur de chaque quart de finale.</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <MatchBox key={i} label={`Quart ${i + 1}`}
                    team1={getQuarterTeam(data, i, 0)} team2={getQuarterTeam(data, i, 1)}
                    winner={data.quarters[i]} onPick={side => pickQuarter(i, side)} size="lg" />
                ))}
              </div>
            </div>
          )}

          {/* ── Demis ───────────────────────────────────────────────────── */}
          {tab === 'demis' && (
            <div className="space-y-10">
              <div>
                <p className="mb-7 text-[14px] text-gray-400">Sélectionne les finalistes. Les perdants jouent la 3e place.</p>
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
                  <p className="mb-3 text-[11px] font-700 uppercase tracking-widest text-gray-400">Match pour la 3e place</p>
                  <MatchBox team1={loser0} team2={loser1} winner={data.thirdPlace} onPick={side => pickThirdPlace(side)} size="lg" />
                </div>
              )}
            </div>
          )}

          {/* ── Finale ──────────────────────────────────────────────────── */}
          {tab === 'finale' && (
            <div className="space-y-10">
              <div>
                <p className="mb-7 text-[14px] text-gray-400">Qui soulève la Coupe du Monde ?</p>
                <MatchBox label="Grande Finale · 19 juillet 2026"
                  team1={getFinalTeam(data, 0)} team2={getFinalTeam(data, 1)}
                  winner={data.final} onPick={side => pickFinal(side)} size="lg" />
              </div>
              {champion && (
                <div className="inline-flex items-center gap-4 rounded-2xl border-2 border-[#eac84a] bg-gradient-to-br from-[#fef9e7] to-[#fdf2cf] px-6 py-4 shadow-[0_12px_30px_rgba(245,166,35,0.22)]">
                  <span className="text-3xl">{champion.flag}</span>
                  <div>
                    <p className="text-[11px] font-700 uppercase tracking-widest text-gray-400">Mon champion 2026</p>
                    <p className="font-condensed text-[22px] font-700 uppercase tracking-wide text-[#b8860b]">{champion.name}</p>
                  </div>
                  <span className="text-3xl">🏆</span>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
