import { useState, useEffect, useMemo, type ReactNode } from 'react'
import { X, Users, Target, CalendarDays, Trophy, Crown, Flame, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Player } from '../types'
import {
  type BracketData,
  migrateData,
  getChampion,
  GROUPS,
  GROUP_TEAMS,
  getQuarterWinner,
  getThirdPlace,
  getFinalTeam,
} from '../utils/bracketData'
import { calculateScore, type ScoreBreakdown } from '../utils/scoreUtils'
import { Medal } from '../components/ui/Medal'
import { avatarColor, initials } from '../components/ui/tokens'

// ════════════════════════════════════════════════════════════════════════════
//  ClassementV2 — premium fantasy-sports leaderboard (route: /classement-v2)
//  Visual-quality-first. Data logic mirrors ClassementPage exactly.
// ════════════════════════════════════════════════════════════════════════════

interface RankEntry {
  player_id: string
  pseudo: string
  breakdown: ScoreBreakdown
  champion: { name: string; flag: string } | null
  bracketData: BracketData | null
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

function Avatar({ name, size = 48, ring = false }: { name: string; size?: number; ring?: boolean }) {
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full font-900 text-white"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        background: avatarColor(name),
        boxShadow: ring ? '0 6px 18px rgba(0,0,0,0.18)' : '0 1px 3px rgba(0,0,0,0.15)',
        border: ring ? '4px solid #fff' : 'none',
      }}
    >
      {initials(name)}
    </div>
  )
}

function Laurels({ sz }: { sz: number }) {
  const lc = '#c8960c', arm = Math.round(sz * 0.52)
  const ls = [
    { cx: 22, cy: 9, rx: 5.5, ry: 9.5, rot: -40 },
    { cx: 17, cy: 23, rx: 5.5, ry: 9, rot: -22 },
    { cx: 15, cy: 37, rx: 5, ry: 8.5, rot: -6 },
    { cx: 17, cy: 50, rx: 4.5, ry: 7.5, rot: 9 },
  ]
  return (
    <div className="relative flex items-center justify-center" style={{ width: sz + arm * 2, height: sz + 10 }}>
      <svg className="absolute left-0 top-[5px]" style={{ width: arm, height: sz }} viewBox="0 0 34 62" fill="none">
        {ls.map((l, i) => <ellipse key={i} cx={l.cx} cy={l.cy} rx={l.rx} ry={l.ry} fill={lc} transform={`rotate(${l.rot} ${l.cx} ${l.cy})`} opacity={0.9 - i * 0.05} />)}
      </svg>
      <div
        className="relative z-10 flex items-center justify-center rounded-full font-800 text-white"
        style={{ width: sz, height: sz, fontSize: Math.round(sz * 0.4), background: 'linear-gradient(140deg,#fada5e 0%,#f5a623 45%,#c87800 100%)', boxShadow: '0 6px 22px rgba(245,166,35,.55)', lineHeight: 1 }}
      >1</div>
      <svg className="absolute right-0 top-[5px]" style={{ width: arm, height: sz }} viewBox="0 0 34 62" fill="none">
        {ls.map((l, i) => <ellipse key={i} cx={34 - l.cx} cy={l.cy} rx={l.rx} ry={l.ry} fill={lc} transform={`rotate(${-l.rot} ${34 - l.cx} ${l.cy})`} opacity={0.9 - i * 0.05} />)}
      </svg>
    </div>
  )
}

function Spark({ pts, color = '#22c55e', w = 240, h = 46 }: { pts: number[]; color?: string; w?: number; h?: number }) {
  if (pts.length < 2) return null
  const mn = Math.min(...pts), mx = Math.max(...pts), rng = mx - mn || 1
  const d = pts.map((v, i) => { const x = (i / (pts.length - 1)) * w; const y = h - 3 - ((v - mn) / rng) * (h - 6); return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}` }).join(' ')
  const area = `${d} L${w},${h} L0,${h} Z`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id="sparkv2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkv2)" />
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChampionBadge({ flag, name, tone = 'gray' }: { flag: string; name: string; tone?: 'gray' | 'gold' }) {
  const cls = tone === 'gold'
    ? 'bg-amber-50 text-amber-800'
    : 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-[6px] text-[13px] font-600 ${cls}`}>
      <span className="text-[15px]">{flag}</span>
      <span className="overflow-hidden text-ellipsis whitespace-nowrap">{name}</span>
    </span>
  )
}

function TrendBadge({ active, delta }: { active: boolean; delta: number }) {
  if (!active) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f3f5] px-3 py-1 text-[12px] font-600 leading-none text-gray-400">
        <span className="h-[7px] w-[7px] rounded-full bg-[#cbd2da]" /> Initial
      </span>
    )
  }
  const up = delta > 0, down = delta < 0
  const cls = up ? 'bg-green-100 text-green-700' : down ? 'bg-red-100 text-red-700' : 'bg-[#f1f3f5] text-gray-500'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-700 leading-none ${cls}`}>
      <span className="text-[13px]">{up ? '↗' : down ? '↘' : '→'}</span>
      <span>{up ? `+${delta}` : down ? `${delta}` : '0'}</span>
    </span>
  )
}

// ─── Sidebar widget ───────────────────────────────────────────────────────────

function Widget({ title, icon, accent = 'navy', children }: { title: string; icon?: ReactNode; accent?: 'navy' | 'red'; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(20,30,60,0.05)]">
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
        {icon}
        <span className={`font-condensed text-[15px] font-700 uppercase tracking-[0.04em] ${accent === 'red' ? 'text-brand-red' : 'text-gray-900'}`}>{title}</span>
      </div>
      {children}
    </div>
  )
}

// ─── Stat ─────────────────────────────────────────────────────────────────────

function Stat({ icon, value, label, gold = false }: { icon: ReactNode; value: ReactNode; label: string; gold?: boolean }) {
  return (
    <div className="flex flex-1 items-center gap-4 px-7 py-2">
      <span className={gold ? 'text-brand-gold' : 'text-gray-300'}>{icon}</span>
      <div className="min-w-0">
        <p className="font-condensed text-[42px] font-800 leading-none text-gray-900">{value}</p>
        <p className="mt-1.5 text-[11px] font-600 uppercase leading-tight tracking-[0.05em] text-gray-400">{label}</p>
      </div>
    </div>
  )
}

// ─── Podium card ──────────────────────────────────────────────────────────────

function PodiumCard({ entry, place, onClick }: { entry: RankEntry; place: 1 | 2 | 3; onClick: () => void }) {
  if (place === 1) {
    return (
      <button
        onClick={onClick}
        className="relative z-10 flex w-full flex-col items-center rounded-[26px] border-2 border-[#eac84a] bg-gradient-to-b from-[#fff3c9] via-[#fffdf3] to-white px-6 pt-9 pb-12 shadow-[0_22px_56px_rgba(245,166,35,0.32),0_0_0_5px_rgba(245,166,35,0.09)] transition duration-150 hover:-translate-y-1 hover:shadow-[0_30px_70px_rgba(245,166,35,0.42),0_0_0_5px_rgba(245,166,35,0.14)]"
      >
        <div className="mb-6"><Laurels sz={92} /></div>
        <Avatar name={entry.pseudo} size={104} ring />
        <p className="font-condensed mt-5 text-[52px] font-800 leading-none text-gray-900">{entry.pseudo}</p>
        {entry.champion
          ? <p className="mt-3 mb-8 text-[19px] font-600 text-[#d97706]">{entry.champion.flag} {entry.champion.name}</p>
          : <p className="mt-3 mb-8 text-[19px] text-gray-300">—</p>}
        <div className="rounded-full bg-gradient-to-br from-brand-navy to-[#00214d] px-16 py-5 shadow-[0_10px_26px_rgba(0,48,135,0.36)]">
          <span className="font-condensed text-[48px] font-800 leading-none text-white">{entry.breakdown.total}</span>
          <span className="font-condensed ml-2 text-[20px] font-600 text-white/70">pts</span>
        </div>
      </button>
    )
  }
  const silver = place === 2
  return (
    <button
      onClick={onClick}
      className={`flex w-full flex-col items-center rounded-t-[22px] rounded-b-xl border px-5 pt-9 pb-10 transition duration-150 hover:-translate-y-0.5 ${
        silver
          ? 'border-[#e2e6ec] bg-gradient-to-b from-white to-[#eef1f5] shadow-[0_10px_26px_rgba(120,130,150,0.16)] hover:shadow-[0_16px_34px_rgba(120,130,150,0.24)]'
          : 'border-[#f1d6bb] bg-gradient-to-b from-[#fffbf6] to-[#fbe9d8] shadow-[0_10px_26px_rgba(200,120,50,0.18)] hover:shadow-[0_16px_34px_rgba(200,120,50,0.26)]'
      }`}
    >
      <div className="mb-6"><Medal rank={place} size={66} /></div>
      <Avatar name={entry.pseudo} size={72} />
      <p className="font-condensed mt-4 text-[30px] font-700 leading-none text-gray-900">{entry.pseudo}</p>
      {entry.champion
        ? <p className="mt-2.5 mb-6 text-[14px] text-gray-500">{entry.champion.flag} {entry.champion.name}</p>
        : <p className="mt-2.5 mb-6 text-[14px] text-gray-300">—</p>}
      <div className={`rounded-full px-7 py-3 ${silver ? 'bg-[#e7ebf0]' : 'bg-[#fbe6d3]'}`}>
        <span className={`font-condensed text-[34px] font-800 leading-none ${silver ? 'text-[#475569]' : 'text-[#b87333]'}`}>{entry.breakdown.total}</span>
        <span className={`ml-1.5 text-[14px] font-500 ${silver ? 'text-[#94a3b8]' : 'text-[#cd9b6f]'}`}>pts</span>
      </div>
    </button>
  )
}

// ─── Player modal ─────────────────────────────────────────────────────────────

function PlayerModal({ entry, onClose }: { entry: RankEntry; onClose: () => void }) {
  const d = entry.bracketData
  const f0 = d ? getFinalTeam(d, 0) : null, f1 = d ? getFinalTeam(d, 1) : null
  const s0 = d ? getQuarterWinner(d, 0) : null, s1 = d ? getQuarterWinner(d, 1) : null, s2 = d ? getQuarterWinner(d, 2) : null, s3 = d ? getQuarterWinner(d, 3) : null
  const third = d ? getThirdPlace(d) : null
  useEffect(() => { const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }; document.addEventListener('keydown', fn); return () => document.removeEventListener('keydown', fn) }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div role="dialog" aria-modal="true" className="relative flex max-h-[90vh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between bg-brand-navy px-5 py-4">
          <div className="flex items-center gap-3">
            <Avatar name={entry.pseudo} size={36} />
            <div><p className="text-[10px] font-600 uppercase tracking-widest text-white/50">Pronostic de</p><p className="font-condensed text-[20px] font-700 uppercase leading-tight text-white">{entry.pseudo}</p></div>
          </div>
          <button onClick={onClose} autoFocus aria-label="Fermer" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"><X size={16} /></button>
        </div>
        <div className="flex-1 divide-y divide-gray-100 overflow-y-auto">
          {!d ? <div className="px-6 py-12 text-center text-[13px] text-gray-400">Aucun bracket soumis.</div> : <>
            <div className="px-5 py-4"><p className="mb-3 text-[10px] font-600 uppercase tracking-widest text-gray-400">Champion</p>
              {entry.champion ? <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"><span className="text-3xl">{entry.champion.flag}</span><span className="font-condensed text-[20px] font-700 uppercase text-amber-800">{entry.champion.name}</span></div> : <p className="text-[13px] text-gray-400">Non sélectionné</p>}
            </div>
            <div className="px-5 py-4"><p className="mb-3 text-[10px] font-600 uppercase tracking-widest text-gray-400">Finale</p>
              <div className="grid grid-cols-2 gap-2">{[f0, f1].map((t, i) => t ? <div key={i} className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${entry.champion?.name === t.name ? 'border-brand-navy bg-brand-navy text-white' : 'border-gray-200 bg-gray-50'}`}><span>{t.flag}</span><span className="truncate text-[12px] font-600">{t.name}</span></div> : <div key={i} className="rounded-lg border border-dashed border-gray-200 px-3 py-2 text-[12px] text-gray-300">—</div>)}</div>
              {third && <p className="mt-2 text-[12px] text-gray-500"><span className="font-600 text-gray-400">3e place :</span> {third.flag} {third.name}</p>}
            </div>
            <div className="px-5 py-4"><p className="mb-3 text-[10px] font-600 uppercase tracking-widest text-gray-400">Demi-finalistes</p>
              <div className="grid grid-cols-2 gap-2">{[s0, s1, s2, s3].map((t, i) => t ? <div key={i} className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2"><span>{t.flag}</span><span className="truncate text-[12px] font-500 text-brand-navy">{t.name}</span></div> : <div key={i} className="rounded-lg border border-dashed border-gray-200 px-3 py-2 text-[12px] text-gray-300">—</div>)}</div>
            </div>
            <div className="px-5 py-4"><p className="mb-3 text-[10px] font-600 uppercase tracking-widest text-gray-400">Qualifiés par groupe</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                {GROUPS.map(g => { const q = d.groupQualified[g]; const teams = GROUP_TEAMS[g]; const t1 = teams?.[q?.[0]], t2 = q?.[1] !== -1 ? teams?.[q?.[1]] : null, t3 = (q?.[2] !== undefined && q?.[2] !== -1) ? teams?.[q?.[2]] : null
                  return (<div key={g}><p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Gr. {g}</p><div className="space-y-0.5">{t1 && <p className="text-[12px] font-500 text-gray-900">{t1.flag} {t1.name}</p>}{t2 && <p className="text-[12px] text-gray-500">{t2.flag} {t2.name}</p>}{t3 && <p className="text-[12px] text-gray-400">{t3.flag} {t3.name}</p>}</div></div>)
                })}
              </div>
            </div>
          </>}
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(d: string) { return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)) }
function countGood(bd: ScoreBreakdown) { return [bd.groups, bd.r32, bd.r16, bd.quarters, bd.semis, bd.final, bd.thirdPlace].filter(v => v > 0).length }
const T_START = '2026-06-11'

const BAREME: [string, string][] = [['Groupe', '2'], ['16e', '2'], ['1/8', '5'], ['Quart', '10'], ['Demi', '15'], ['Finale', '25'], ['3e place', '10']]

// ════════════════════════════════════════════════════════════════════════════
//  Page
// ════════════════════════════════════════════════════════════════════════════

export default function ClassementV2() {
  const { player } = useAuth()
  const [entries, setEntries] = useState<RankEntry[]>([])
  const [hasResults, setHasResults] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sel, setSel] = useState<RankEntry | null>(null)
  const [matchCount, setMatchCount] = useState(0)
  const days = daysUntil(T_START)

  useEffect(() => {
    async function load() {
      try {
        const [rR, pR, plR, mR] = await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from('tournament_results').select('data').limit(1).maybeSingle(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from('bracket_predictions').select('player_id, data'),
          supabase.from('players').select('id, pseudo'),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from('matches').select('id', { count: 'exact', head: true }).not('score_home', 'is', null),
        ])
        if (plR.error) throw plR.error
        setMatchCount(mR.count ?? 0)
        const real: BracketData = migrateData(rR.data?.data ?? null)
        const preds: { player_id: string; data: unknown }[] = pR.error ? [] : (pR.data ?? [])
        const players: Pick<Player, 'id' | 'pseudo'>[] = plR.data ?? []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyR = real.r32.some((x: any) => x !== null) || Object.values(real.groupQualified).some((q: any) => q[0] !== 0 || q[1] !== 1)
        setHasResults(anyR)
        const pm = new Map(preds.map(p => [p.player_id, migrateData(p.data)]))
        const ranked: RankEntry[] = players.map(p => { const bd = pm.get(p.id) ?? null; return { player_id: p.id, pseudo: p.pseudo, breakdown: bd ? calculateScore(bd, real) : { groups: 0, r32: 0, r16: 0, quarters: 0, semis: 0, final: 0, thirdPlace: 0, total: 0 }, champion: bd ? getChampion(bd) : null, bracketData: bd } })
        if (anyR) ranked.sort((a, b) => b.breakdown.total - a.breakdown.total); else ranked.sort((a, b) => a.pseudo.localeCompare(b.pseudo))
        setEntries(ranked)
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    load()
  }, [])

  const me = entries.find(e => e.player_id === player?.id)
  const myRank = hasResults ? entries.findIndex(e => e.player_id === player?.id) + 1 : 0
  const leader = entries[0], second = entries[1]
  const gap = leader && second ? leader.breakdown.total - second.breakdown.total : 0
  const amLeader = leader?.player_id === player?.id
  const gapVal = amLeader ? gap : (me && leader ? leader.breakdown.total - me.breakdown.total : 0)
  const gapSub = amLeader ? second?.pseudo : leader?.pseudo

  const champMap = useMemo(() => {
    const m = new Map<string, { flag: string; count: number }>()
    for (const e of entries) if (e.champion) { const x = m.get(e.champion.name); x ? x.count++ : m.set(e.champion.name, { flag: e.champion.flag, count: 1 }) }
    return [...m.entries()].sort((a, b) => b[1].count - a[1].count)
  }, [entries])

  const noChamp = entries.filter(e => !e.bracketData).length
  const submitted = entries.filter(e => e.bracketData).length
  const uniqueChamp = champMap.length
  const bestPlayer = useMemo(() => { if (!hasResults || !entries.length) return null; return entries.reduce((b, e) => countGood(e.breakdown) > countGood(b.breakdown) ? e : b, entries[0]) }, [entries, hasResults])
  const bestGood = bestPlayer ? countGood(bestPlayer.breakdown) : 0

  return (
    <div className="min-h-full w-full px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-[1280px]">

        {/* ── HEADER CARD ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-8 rounded-3xl bg-white px-7 py-8 shadow-[0_2px_12px_rgba(20,30,60,0.05)] md:px-10 md:py-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="mb-2 text-[14px] font-700 uppercase tracking-[0.24em] text-brand-navy">FIFA World Cup 2026</p>
            <h1 className="font-condensed text-[64px] font-800 uppercase leading-[0.9] tracking-[0.01em] text-gray-900 md:text-[88px]">Classement</h1>
            <p className="mt-3 max-w-lg text-[16px] leading-relaxed text-gray-500">
              {hasResults
                ? "Les scores sont calculés dès le coup d'envoi. Clique sur un joueur pour voir son pronostic complet."
                : 'Tout le monde démarre à 0. Clique sur un joueur pour voir son pronostic complet.'}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap divide-x divide-gray-200 rounded-2xl border border-gray-100 bg-[#fcfcfd] py-4">
            <Stat icon={<Users size={32} strokeWidth={1.7} />} value={entries.length} label="joueurs" />
            <Stat icon={<Target size={32} strokeWidth={1.7} />} value={matchCount} label="matchs joués" />
            <Stat icon={<CalendarDays size={32} strokeWidth={1.7} />} value={days === 0 ? 'Auj.' : days} label={days === 0 ? 'jour J' : `jour${days > 1 ? 's' : ''} restants`} />
            <Stat icon={<Trophy size={32} strokeWidth={1.7} />} value={uniqueChamp} label="champions" gold />
          </div>
        </div>

        {loading ? (
          <div className="flex h-[280px] items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand-navy border-t-transparent" />
          </div>
        ) : entries.length === 0 ? (
          <div className="mt-6 rounded-3xl bg-white px-10 py-20 text-center text-[14px] text-gray-400 shadow-[0_2px_12px_rgba(20,30,60,0.05)]">Aucun participant pour l'instant.</div>
        ) : (
          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">

            {/* ── MAIN: PODIUM + TABLE in ONE connected card ───────────── */}
            <div className="min-w-0 flex-1 overflow-hidden rounded-3xl bg-white shadow-[0_2px_16px_rgba(20,30,60,0.07)]">

              {/* Podium "lid" */}
              {entries.length >= 1 && (
                <div className="border-b border-gray-100 bg-gradient-to-b from-[#f3f7fb] to-white px-6 pt-12 pb-9 md:px-10 md:pt-14">
                  <div className="mx-auto grid max-w-[860px] items-end gap-3 sm:gap-4" style={{ gridTemplateColumns: '1fr 1.42fr 1fr' }}>
                    <div className="pt-16">{entries[1] && <PodiumCard entry={entries[1]} place={2} onClick={() => setSel(entries[1])} />}</div>
                    <PodiumCard entry={entries[0]} place={1} onClick={() => setSel(entries[0])} />
                    <div className="pt-[88px]">{entries[2] && <PodiumCard entry={entries[2]} place={3} onClick={() => setSel(entries[2])} />}</div>
                  </div>
                </div>
              )}

              {/* Table header */}
              <div className="hidden grid-cols-[72px_1fr_130px_190px_120px] items-center gap-2 border-b border-gray-100 bg-[#fafbfc] px-7 py-4 sm:grid">
                {['#', 'JOUEUR', 'POINTS', 'CHAMPION', 'ÉVOLUTION'].map((h, i) => (
                  <span key={h} className={`text-[10px] font-700 uppercase tracking-[0.16em] text-gray-400 ${i >= 2 ? 'text-center' : 'text-left'}`}>{h}</span>
                ))}
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-100">
                {entries.map((entry, i) => {
                  const rank = i + 1
                  const isMe = entry.player_id === player?.id
                  const delta = rank === 1 ? 1 : rank === 2 ? -1 : rank === 4 ? 1 : rank === 5 ? -1 : 0
                  return (
                    <div key={entry.player_id} onClick={() => setSel(entry)}
                      className={`grid min-h-[84px] cursor-pointer grid-cols-[52px_1fr_auto] items-center gap-2 px-5 transition-colors duration-150 hover:bg-[#f7f9fb] sm:grid-cols-[72px_1fr_130px_190px_120px] sm:px-7 ${isMe ? 'bg-[#f0f5ff]' : ''}`}>
                      <div className="flex items-center"><Medal rank={rank} size={42} /></div>
                      <div className="flex min-w-0 items-center gap-4 py-3">
                        <Avatar name={entry.pseudo} size={52} />
                        <div className="flex min-w-0 flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[17px] font-700 ${isMe ? 'text-brand-navy' : 'text-gray-900'}`}>{entry.pseudo}</span>
                            {isMe && <span className="rounded-full bg-brand-navy px-2 py-0.5 text-[10px] font-600 uppercase tracking-[0.05em] text-white">moi</span>}
                            {!entry.bracketData && <span className="text-[10px] italic text-gray-300">Non soumis</span>}
                          </div>
                          <div className="flex items-center gap-2 sm:hidden">
                            {entry.champion ? <span className="text-[12px] text-gray-500">{entry.champion.flag} {entry.champion.name}</span> : <span className="text-[12px] text-gray-300">—</span>}
                            {hasResults && <span className={`text-[12px] font-700 ${delta > 0 ? 'text-green-700' : delta < 0 ? 'text-red-700' : 'text-gray-500'}`}>{delta > 0 ? `↗+${delta}` : delta < 0 ? `↘${delta}` : '→0'}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="pr-1 text-right sm:pr-0 sm:text-center">
                        {hasResults ? (
                          <span className="inline-flex items-baseline gap-1">
                            <strong className={`font-condensed text-[28px] font-800 leading-none ${isMe ? 'text-brand-red' : 'text-brand-navy'}`}>{entry.breakdown.total}</strong>
                            <span className="text-[12px] text-gray-400">pts</span>
                          </span>
                        ) : <span className="font-condensed text-[24px] font-700 text-gray-200">0</span>}
                      </div>
                      <div className="hidden justify-center sm:flex">
                        {entry.champion ? <ChampionBadge flag={entry.champion.flag} name={entry.champion.name} /> : <span className="text-[12px] text-[#c7cbd1]">—</span>}
                      </div>
                      <div className="hidden items-center justify-center sm:flex">
                        <TrendBadge active={hasResults} delta={delta} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Legend footer */}
              <div className="flex flex-wrap items-center gap-x-1 gap-y-1 border-t border-gray-100 bg-[#fafbfc] px-7 py-4 text-[12px] text-gray-500">
                <span className="mr-2 font-700 uppercase tracking-wide text-gray-400">Barème</span>
                {BAREME.map(([l, v], i) => (
                  <span key={l} className="flex items-center gap-1">
                    <span className="text-gray-500">{l}</span>
                    <strong className="font-700 text-brand-navy">{v}</strong>
                    {i < BAREME.length - 1 && <span className="mx-1.5 text-gray-300">·</span>}
                  </span>
                ))}
              </div>
            </div>

            {/* ── SIDEBAR ──────────────────────────────────────────────── */}
            <aside className="flex w-full flex-shrink-0 flex-col gap-5 lg:sticky lg:top-6 lg:w-[348px]">

              <Widget title="Champions choisis" icon={<Crown size={18} className="text-brand-gold" />}>
                {champMap.map(([name, { flag, count }]) => (
                  <div key={name} className="flex items-center justify-between border-b border-gray-50 px-5 py-3 last:border-b-0">
                    <span className="flex items-center gap-2 text-[14px] text-gray-900">{flag} {name}</span>
                    <span className="font-condensed text-[18px] font-700 text-gray-900">{count}</span>
                  </div>
                ))}
                {noChamp > 0 && (
                  <div className="flex items-center justify-between px-5 py-3">
                    <span className="text-[14px] text-gray-400">— Aucun</span>
                    <span className="font-condensed text-[18px] font-700 text-gray-300">{noChamp}</span>
                  </div>
                )}
              </Widget>

              <Widget title="Meilleur joueur" icon={<Flame size={18} className="text-brand-red" />}>
                <div className="flex items-center gap-4 p-5">
                  <div className="font-condensed flex h-[58px] w-[58px] flex-shrink-0 items-center justify-center rounded-full bg-brand-navy text-[24px] font-800 text-white shadow-[0_3px_12px_rgba(0,48,135,0.28)]">
                    {hasResults ? bestGood : submitted}
                  </div>
                  <div>
                    {hasResults ? (<><p className="mb-0.5 text-[12px] text-gray-400">bonnes prédictions</p><p className="text-[16px] font-600 text-gray-900">{bestPlayer?.pseudo ?? '—'}</p></>) : (
                      <><p className="mb-0.5 text-[16px] font-600 text-gray-900">{submitted} / {entries.length} prêts</p><p className="text-[12px] leading-snug text-gray-400">brackets soumis — désigné dès le 1er match</p></>
                    )}
                  </div>
                </div>
              </Widget>

              {entries.length >= 2 && (
                <Widget title={!hasResults ? 'Compte à rebours' : amLeader ? 'Mon avance' : 'Écart avec le 1er'} icon={<TrendingUp size={18} className="text-gray-300" />}>
                  <div className="p-5">
                    {hasResults ? (
                      <>
                        <p className="font-condensed text-[36px] font-800 leading-none text-green-500">+{gapVal} pts</p>
                        <p className="mb-3 mt-1.5 text-[13px] text-gray-500">({gapSub})</p>
                        <Spark pts={[gapVal - 4, gapVal - 2, gapVal + 1, gapVal + 4, gapVal + 6]} />
                      </>
                    ) : (
                      <>
                        <p className="font-condensed text-[44px] font-800 leading-none text-brand-navy">{days}<span className="ml-2 text-[16px] font-600 text-gray-400">jour{days > 1 ? 's' : ''}</span></p>
                        <p className="mt-2 text-[13px] leading-relaxed text-gray-500">avant le coup d'envoi — tout le monde démarre à <strong className="text-gray-900">0 pt</strong></p>
                      </>
                    )}
                  </div>
                </Widget>
              )}

              {me && !hasResults && (
                <Widget title="Mon pronostic" accent="red">
                  <div className="p-5">
                    {me.bracketData ? (
                      <>
                        <div className="mb-3 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="text-[14px] font-600 text-gray-900">Bracket soumis</span>
                        </div>
                        {me.champion ? (
                          <div className="flex items-center gap-3 rounded-xl border border-[#f0dca0] bg-[#fef9e7] px-4 py-3">
                            <span className="text-[26px]">{me.champion.flag}</span>
                            <div><p className="mb-px text-[10px] uppercase tracking-[0.08em] text-gray-400">Mon champion</p><p className="font-condensed text-[18px] font-700 text-[#b8860b]">{me.champion.name}</p></div>
                          </div>
                        ) : <p className="text-[13px] text-gray-400">Champion non sélectionné</p>}
                      </>
                    ) : (
                      <>
                        <div className="mb-2 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-amber-500" />
                          <span className="text-[14px] font-600 text-gray-900">Bracket non soumis</span>
                        </div>
                        <p className="text-[13px] leading-relaxed text-gray-500">Complète ton bracket avant le {new Date(T_START).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} pour participer.</p>
                      </>
                    )}
                  </div>
                </Widget>
              )}

              {me && myRank > 0 && hasResults && (
                <Widget title="Ma position" accent="red">
                  <div className="flex items-center justify-around p-5">
                    <div className="text-center">
                      <p className="font-condensed text-[42px] font-800 leading-none text-brand-navy">#{myRank}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-gray-400">rang</p>
                    </div>
                    <div className="h-12 w-px bg-gray-200" />
                    <div className="text-center">
                      <p className="font-condensed text-[42px] font-800 leading-none text-brand-red">{me.breakdown.total}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-gray-400">pts</p>
                    </div>
                  </div>
                </Widget>
              )}

            </aside>
          </div>
        )}

        {sel && <PlayerModal entry={sel} onClose={() => setSel(null)} />}
      </div>
    </div>
  )
}
