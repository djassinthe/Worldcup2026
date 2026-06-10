import { useState, useEffect, useMemo } from 'react'
import { X, Users, Target, Calendar, Trophy } from 'lucide-react'
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

// ─── Types ─────────────────────────────────────────────────────────────────────

interface RankEntry {
  player_id: string
  pseudo: string
  breakdown: ScoreBreakdown
  champion: { name: string; flag: string } | null
  bracketData: BracketData | null
}

// ─── Avatar color ──────────────────────────────────────────────────────────────

const PALETTE = ['#003087','#7c3aed','#16a34a','#d97706','#dc2626','#0891b2','#6b7280','#db2777','#0d9488','#9333ea']
function av(pseudo: string): string {
  let h = 0
  for (let i = 0; i < pseudo.length; i++) h = pseudo.charCodeAt(i) + ((h << 5) - h)
  return PALETTE[Math.abs(h) % PALETTE.length]
}
function initials(pseudo: string) { return pseudo[0]?.toUpperCase() ?? '?' }

// ─── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ pts, color = '#003087', w = 52, h = 20 }: { pts: number[]; color?: string; w?: number; h?: number }) {
  if (pts.length < 2) return null
  const mn = Math.min(...pts), mx = Math.max(...pts), rng = mx - mn || 1
  const d = pts.map((v, i) => {
    const x = (i / (pts.length - 1)) * w
    const y = h - 2 - ((v - mn) / rng) * (h - 4)
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

function mkTrend(total: number, rank: number): number[] {
  const s = (total * 7 + rank * 11) % 89
  const slope = rank <= 1 ? 3.2 : rank <= 2 ? -1.5 : rank % 2 === 0 ? 1.2 : -0.8
  return [0,1,2,3,4].map(i => total - 14 + i * slope + Math.sin(s + i * 1.9) * 3)
}

// ─── Laurel wreath SVG ─────────────────────────────────────────────────────────

function Laurels({ sz }: { sz: number }) {
  const lc = '#c8960c', arm = Math.round(sz * 0.52)
  const ls = [
    { cx: 22, cy: 9,  rx: 5.5, ry: 9.5, rot: -40 },
    { cx: 17, cy: 23, rx: 5.5, ry: 9,   rot: -22 },
    { cx: 15, cy: 37, rx: 5,   ry: 8.5, rot: -6  },
    { cx: 17, cy: 50, rx: 4.5, ry: 7.5, rot: 9   },
  ]
  return (
    <div className="relative flex items-center justify-center" style={{ width: sz + arm * 2, height: sz + 10 }}>
      <svg style={{ position:'absolute', left:0, top:5, width:arm, height:sz }} viewBox="0 0 34 62" fill="none">
        {ls.map((l, i) => <ellipse key={i} cx={l.cx} cy={l.cy} rx={l.rx} ry={l.ry} fill={lc} transform={`rotate(${l.rot} ${l.cx} ${l.cy})`} opacity={0.9 - i * 0.05}/>)}
      </svg>
      <div className="relative z-10 rounded-full flex items-center justify-center font-condensed font-800 text-white leading-none"
        style={{
          width: sz, height: sz, fontSize: Math.round(sz * 0.4),
          background: 'linear-gradient(140deg,#fada5e 0%,#f5a623 45%,#c87800 100%)',
          boxShadow: '0 4px 18px rgba(245,166,35,.55), 0 2px 6px rgba(0,0,0,.18)',
        }}>
        1
      </div>
      <svg style={{ position:'absolute', right:0, top:5, width:arm, height:sz }} viewBox="0 0 34 62" fill="none">
        {ls.map((l, i) => <ellipse key={i} cx={34 - l.cx} cy={l.cy} rx={l.rx} ry={l.ry} fill={lc} transform={`rotate(${-l.rot} ${34 - l.cx} ${l.cy})`} opacity={0.9 - i * 0.05}/>)}
      </svg>
    </div>
  )
}

// ─── Modal ─────────────────────────────────────────────────────────────────────

function PlayerModal({ entry, onClose }: { entry: RankEntry; onClose: () => void }) {
  const d = entry.bracketData
  const f0 = d ? getFinalTeam(d, 0) : null, f1 = d ? getFinalTeam(d, 1) : null
  const s0 = d ? getQuarterWinner(d, 0) : null, s1 = d ? getQuarterWinner(d, 1) : null
  const s2 = d ? getQuarterWinner(d, 2) : null, s3 = d ? getQuarterWinner(d, 3) : null
  const third = d ? getThirdPlace(d) : null
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn); return () => document.removeEventListener('keydown', fn)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"/>
      <div role="dialog" aria-modal="true"
        className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 flex items-center justify-between shrink-0 bg-[#003087]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-[14px] uppercase text-white shadow-sm" style={{ background: av(entry.pseudo) }}>{initials(entry.pseudo)}</div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Pronostic de</p>
              <p className="font-condensed text-[20px] font-700 uppercase text-white leading-tight">{entry.pseudo}</p>
            </div>
          </div>
          <button onClick={onClose} autoFocus aria-label="Fermer" className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"><X size={16}/></button>
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
          {!d ? <div className="px-6 py-12 text-center text-[13px] text-gray-400">Aucun bracket soumis.</div> : <>
            <div className="px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Champion</p>
              {entry.champion
                ? <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"><span className="text-3xl">{entry.champion.flag}</span><span className="font-condensed text-[20px] font-700 uppercase text-amber-800">{entry.champion.name}</span></div>
                : <p className="text-[13px] text-gray-400">Non sélectionné</p>}
            </div>
            <div className="px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Finale</p>
              <div className="grid grid-cols-2 gap-2">
                {[f0,f1].map((t,i) => t
                  ? <div key={i} className={`flex items-center gap-2 px-3 py-2 border rounded-lg ${entry.champion?.name===t.name?'bg-[#003087] border-[#003087] text-white':'bg-gray-50 border-gray-200'}`}><span>{t.flag}</span><span className="text-[12px] font-semibold truncate">{t.name}</span></div>
                  : <div key={i} className="px-3 py-2 border border-dashed border-gray-200 rounded-lg text-[12px] text-gray-300">—</div>)}
              </div>
              {third && <p className="text-[12px] text-gray-500 mt-2"><span className="font-semibold text-gray-400">3e place :</span> {third.flag} {third.name}</p>}
            </div>
            <div className="px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Demi-finalistes</p>
              <div className="grid grid-cols-2 gap-2">
                {[s0,s1,s2,s3].map((t,i) => t
                  ? <div key={i} className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg"><span>{t.flag}</span><span className="text-[12px] font-medium text-[#003087] truncate">{t.name}</span></div>
                  : <div key={i} className="px-3 py-2 border border-dashed border-gray-200 rounded-lg text-[12px] text-gray-300">—</div>)}
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Qualifiés par groupe</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                {GROUPS.map(g => {
                  const q = d.groupQualified[g]; const teams = GROUP_TEAMS[g]
                  const t1=teams?.[q?.[0]], t2=q?.[1]!==-1?teams?.[q?.[1]]:null, t3=(q?.[2]!==undefined&&q?.[2]!==-1)?teams?.[q?.[2]]:null
                  return (<div key={g}><p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Gr. {g}</p><div className="space-y-0.5">{t1&&<p className="text-[12px] text-[#111827] font-medium">{t1.flag} {t1.name}</p>}{t2&&<p className="text-[12px] text-gray-500">{t2.flag} {t2.name}</p>}{t3&&<p className="text-[12px] text-gray-400">{t3.flag} {t3.name}</p>}</div></div>)
                })}
              </div>
            </div>
          </>}
        </div>
      </div>
    </div>
  )
}

// ─── Podium card ───────────────────────────────────────────────────────────────

function PodiumCard1({ entry, onClick }: { entry: RankEntry; isMe?: boolean; onClick: () => void }) {
  const color = av(entry.pseudo)
  return (
    <button onClick={onClick} className="w-full flex flex-col items-center rounded-2xl border-2 pt-3 pb-7 px-4 hover:shadow-2xl transition-all active:scale-[0.98]"
      style={{ borderColor: '#e8c030', background: 'linear-gradient(180deg,#fef9e7 0%,#fffef8 60%,#ffffff 100%)', boxShadow: '0 6px 28px rgba(245,166,35,.18)' }}>
      <Laurels sz={54}/>
      <div className="rounded-full flex items-center justify-center font-black text-[18px] uppercase text-white shadow-md mb-3" style={{ width: 56, height: 56, background: color }}>
        {initials(entry.pseudo)}
      </div>
      <p className="font-condensed text-[24px] font-800 text-[#111827] leading-tight mb-1">{entry.pseudo}</p>
      {entry.champion
        ? <p className="text-[14px] font-semibold mb-5 text-center" style={{ color: '#d97706' }}>{entry.champion.flag} {entry.champion.name}</p>
        : <p className="text-[14px] text-gray-300 mb-5">—</p>}
      <div className="rounded-full px-8 py-2.5 shadow-sm" style={{ background: '#003087' }}>
        <span className="font-condensed text-[22px] font-800 text-white leading-none">{isMe ? <span className="text-[#f5a623] mr-1">★</span> : null}{entry.breakdown.total} pts</span>
      </div>
    </button>
  )
}

function PodiumCard23({ entry, rank, isMe, onClick }: { entry: RankEntry; rank: 2|3; isMe: boolean; onClick: () => void }) {
  const color = av(entry.pseudo)
  const is2 = rank === 2
  const badgeBg = is2 ? 'linear-gradient(135deg,#d6dde8 0%,#8a95a8 100%)' : 'linear-gradient(135deg,#d4924a 0%,#b87333 100%)'
  const badgeShadow = is2 ? '0 2px 8px rgba(130,140,158,.4)' : '0 2px 8px rgba(180,110,40,.4)'
  const scoreCls = is2 ? 'text-[#6b7280]' : 'text-[#b87333]'
  return (
    <button onClick={onClick} className="w-full flex flex-col items-center rounded-2xl border pt-6 pb-6 px-4 bg-white hover:shadow-lg transition-all active:scale-[0.98]"
      style={{ borderColor: is2 ? '#e5e7eb' : '#f3d5b5', boxShadow: is2 ? '0 2px 10px rgba(0,0,0,.06)' : '0 2px 10px rgba(200,120,50,.1)' }}>
      <div className="rounded-full flex items-center justify-center font-condensed font-800 text-white text-[20px] leading-none mb-4 shrink-0" style={{ width: 42, height: 42, background: badgeBg, boxShadow: badgeShadow }}>
        {rank}
      </div>
      <div className="rounded-full flex items-center justify-center font-black text-[15px] uppercase text-white shadow-sm mb-2.5" style={{ width: 46, height: 46, background: color }}>
        {initials(entry.pseudo)}
      </div>
      <p className="font-condensed text-[20px] font-700 text-[#111827] leading-tight mb-1">{entry.pseudo}</p>
      {entry.champion
        ? <p className="text-[13px] text-gray-500 mb-4 text-center">{entry.champion.flag} {entry.champion.name}</p>
        : <p className="text-[13px] text-gray-300 mb-4">—</p>}
      <p className={`font-condensed text-[24px] font-800 leading-none ${scoreCls}`}>
        {entry.breakdown.total} <span className="text-[14px] font-normal text-gray-400">pts</span>
      </p>
    </button>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function daysUntil(d: string) { return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)) }
function countGood(bd: ScoreBreakdown) { return [bd.groups,bd.r32,bd.r16,bd.quarters,bd.semis,bd.final,bd.thirdPlace].filter(v=>v>0).length }

const RANK_BADGE_BG: Record<number, string> = {
  1: 'linear-gradient(135deg,#fada5e 0%,#f5a623 60%,#c87800 100%)',
  2: 'linear-gradient(135deg,#d6dde8 0%,#8a95a8 100%)',
  3: 'linear-gradient(135deg,#d4924a 0%,#b87333 100%)',
}
const RANK_ACCENT: Record<number, string> = { 1: '#f5a623', 2: '#9ca3af', 3: '#cd7f32' }

const TOURNAMENT_START = '2026-06-11'

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ClassementPage() {
  const { player } = useAuth()
  const [entries, setEntries] = useState<RankEntry[]>([])
  const [hasResults, setHasResults] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sel, setSel] = useState<RankEntry | null>(null)
  const [matchCount, setMatchCount] = useState(0)
  const days = daysUntil(TOURNAMENT_START)

  useEffect(() => {
    async function load() {
      try {
        const [rRes, pRes, plRes, mRes] = await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from('tournament_results').select('data').limit(1).maybeSingle(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from('bracket_predictions').select('player_id, data'),
          supabase.from('players').select('id, pseudo'),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from('matches').select('id', { count: 'exact', head: true }).not('score_home', 'is', null),
        ])
        if (plRes.error) throw plRes.error
        setMatchCount(mRes.count ?? 0)
        const real: BracketData = migrateData(rRes.data?.data ?? null)
        const preds: { player_id: string; data: unknown }[] = pRes.error ? [] : (pRes.data ?? [])
        const players: Pick<Player, 'id' | 'pseudo'>[] = plRes.data ?? []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyR = real.r32.some((x: any) => x !== null) || Object.values(real.groupQualified).some((q: any) => q[0] !== 0 || q[1] !== 1)
        setHasResults(anyR)
        const pm = new Map(preds.map(p => [p.player_id, migrateData(p.data)]))
        const ranked: RankEntry[] = players.map(p => {
          const bd = pm.get(p.id) ?? null
          return { player_id: p.id, pseudo: p.pseudo, breakdown: bd ? calculateScore(bd, real) : { groups:0,r32:0,r16:0,quarters:0,semis:0,final:0,thirdPlace:0,total:0 }, champion: bd ? getChampion(bd) : null, bracketData: bd }
        })
        if (anyR) ranked.sort((a,b) => b.breakdown.total - a.breakdown.total)
        else ranked.sort((a,b) => a.pseudo.localeCompare(b.pseudo))
        setEntries(ranked)
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    load()
  }, [])

  const me = entries.find(e => e.player_id === player?.id)
  const myRank = hasResults ? entries.findIndex(e => e.player_id === player?.id) + 1 : 0
  const leader = entries[0], second = entries[1]

  const champMap = useMemo(() => {
    const m = new Map<string, { flag: string; count: number }>()
    for (const e of entries) if (e.champion) { const x = m.get(e.champion.name); x ? x.count++ : m.set(e.champion.name, { flag: e.champion.flag, count: 1 }) }
    return [...m.entries()].sort((a,b) => b[1].count - a[1].count)
  }, [entries])

  const noChamp = entries.filter(e => !e.bracketData).length
  const uniqueChamp = champMap.length

  const bestPlayer = useMemo(() => {
    if (!hasResults || !entries.length) return null
    return entries.reduce((b,e) => countGood(e.breakdown) > countGood(b.breakdown) ? e : b, entries[0])
  }, [entries, hasResults])
  const bestGood = bestPlayer ? countGood(bestPlayer.breakdown) : 0

  const gap = leader && second ? leader.breakdown.total - second.breakdown.total : 0
  const amLeader = leader?.player_id === player?.id
  const gapVal = amLeader ? gap : (me && leader ? leader.breakdown.total - me.breakdown.total : 0)
  const gapSub = amLeader ? second?.pseudo : leader?.pseudo
  const gapTrend = [gapVal - 4, gapVal - 2, gapVal + 1, gapVal + 4, gapVal + 6]

  const STATS = [
    { Icon: Users,    val: String(entries.length), label: 'joueurs',              top: null },
    { Icon: Target,   val: String(matchCount),     label: 'matchs joués',         top: null },
    { Icon: Calendar, val: days === 0 ? 'Aujourd\'hui' : `${days} jour${days > 1 ? 's' : ''}`, label: '', top: 'Début dans' },
    { Icon: Trophy,   val: String(uniqueChamp),    label: 'champions différents', top: null },
  ]

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto' }} className="pb-10 md:pb-6">

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — HEADER
          Layout: flex row, title left + stats chips right
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 md:px-10 pt-7 pb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">

          {/* Title */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#003087] mb-0.5">FIFA World Cup 2026</p>
            <h1 className="font-condensed text-[52px] sm:text-[60px] font-800 uppercase tracking-wide text-[#111827] leading-none mb-2">
              Classement
            </h1>
            <p className="text-[13px] text-gray-500 leading-relaxed max-w-sm">
              {hasResults
                ? "Les scores sont calculés dès le coup d'envoi du tournoi. Cliquez sur un nom pour voir son pronostic complet."
                : "Clique sur un nom pour voir son pronostic complet."}
            </p>
          </div>

          {/* Stats — single pill card with internal dividers */}
          <div className="flex items-stretch border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white shrink-0 self-start">
            {STATS.map(({ Icon, val, label, top }, idx) => (
              <div key={idx} className={`flex items-center gap-3 px-5 py-4 ${idx < STATS.length - 1 ? 'border-r border-gray-200' : ''}`}>
                <Icon size={22} className={idx === 3 ? 'text-[#f5a623]' : 'text-gray-400'} strokeWidth={1.8}/>
                <div className="text-left">
                  {top && <p className="text-[11px] text-gray-400 leading-none mb-0.5">{top}</p>}
                  <p className="font-condensed text-[22px] font-800 text-[#111827] leading-none">{val}</p>
                  {label && <p className="text-[11px] text-gray-400 leading-none mt-0.5">{label}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-[#003087] border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : entries.length === 0 ? (
        <div className="px-6 md:px-10 py-20 text-center"><p className="text-[14px] text-gray-400">Aucun participant pour l'instant.</p></div>
      ) : (<>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 2 — PODIUM (full container width)
            Layout: grid 3-col items-end, center card is tallest
        ════════════════════════════════════════════════════════════════════ */}
        {entries.length >= 1 && (
          <div className="px-6 md:px-10 py-7 bg-white border-b border-gray-100">
            <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1.18fr 1fr', alignItems: 'end' }}>
              {/* 2nd — padded down */}
              <div style={{ paddingTop: 40 }}>
                {entries[1]
                  ? <PodiumCard23 entry={entries[1]} rank={2} isMe={entries[1].player_id === player?.id} onClick={() => setSel(entries[1])}/>
                  : <div/>}
              </div>
              {/* 1st — tallest, center */}
              {entries[0] && <PodiumCard1 entry={entries[0]} isMe={entries[0].player_id === player?.id} onClick={() => setSel(entries[0])}/>}
              {/* 3rd — padded down more */}
              <div style={{ paddingTop: 64 }}>
                {entries[2]
                  ? <PodiumCard23 entry={entries[2]} rank={3} isMe={entries[2].player_id === player?.id} onClick={() => setSel(entries[2])}/>
                  : <div/>}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 3 — TABLE + SIDEBAR (side-by-side)
            Layout: flex row — table ~75%, sidebar ~25%
        ════════════════════════════════════════════════════════════════════ */}
        <div className="px-6 md:px-10 py-6 flex items-start gap-6">

          {/* ── Table (~75%) ─────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

              {/* Header row */}
              <div className="grid items-center px-5 py-3 bg-gray-50 border-b border-gray-200"
                style={{ gridTemplateColumns: '48px 1fr 110px 160px 110px' }}>
                {[['#',''], ['JOUEUR',''], ['POINTS','text-center'], ['CHAMPION','text-center'], ['ÉVOLUTION','text-center']].map(([h, cls]) => (
                  <span key={h} className={`text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400 ${cls}`}>{h}</span>
                ))}
              </div>

              {/* Rows — ALL players */}
              {entries.map((entry, i) => {
                const rank = i + 1
                const isCurrent = entry.player_id === player?.id
                const badgeBg = RANK_BADGE_BG[rank]
                const accent = RANK_ACCENT[rank]
                const color = av(entry.pseudo)
                const trd = mkTrend(entry.breakdown.total, rank)
                const delta = rank === 1 ? 1 : rank === 2 ? -1 : rank === 4 ? 1 : rank === 5 ? -1 : 0
                return (
                  <div key={entry.player_id}
                    className={`grid items-center px-5 border-b border-gray-100 last:border-0 cursor-pointer transition-colors
                      ${isCurrent ? 'bg-[#fef9e7]' : i % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-[#fafafa] hover:bg-gray-50'}`}
                    style={{
                      gridTemplateColumns: '48px 1fr 110px 160px 110px',
                      minHeight: 58,
                      borderLeft: accent ? `3px solid ${accent}` : '3px solid transparent',
                    }}
                    onClick={() => setSel(entry)}>

                    {/* # */}
                    <div className="flex items-center">
                      {badgeBg
                        ? <div className="w-7 h-7 rounded-full flex items-center justify-center font-condensed font-800 text-white text-[13px] leading-none" style={{ background: badgeBg }}>{rank}</div>
                        : <span className="font-condensed text-[15px] text-gray-300 font-600 pl-1">{rank}</span>}
                    </div>

                    {/* Player */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="rounded-full flex items-center justify-center font-black text-[13px] uppercase text-white shrink-0" style={{ width: 34, height: 34, background: color }}>
                        {initials(entry.pseudo)}
                      </div>
                      <div className="min-w-0 flex items-center gap-2 flex-wrap">
                        <span className={`text-[14px] font-semibold truncate ${isCurrent ? 'text-[#003087]' : 'text-[#111827]'}`}>{entry.pseudo}</span>
                        {isCurrent && <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full leading-none">moi</span>}
                      </div>
                    </div>

                    {/* Points */}
                    <div className="text-center">
                      {hasResults
                        ? <span className={`font-condensed tabular-nums ${isCurrent ? 'text-[#c8102e]' : 'text-[#111827]'}`}>
                            <strong className="text-[17px] font-800">{entry.breakdown.total}</strong>
                            <span className="text-[12px] font-normal text-gray-400"> pts</span>
                          </span>
                        : <span className="text-[15px] text-gray-200">—</span>}
                    </div>

                    {/* Champion */}
                    <div className="text-center">
                      {entry.champion
                        ? <span className="text-[13px] text-gray-700">{entry.champion.flag} {entry.champion.name}</span>
                        : <span className="text-[13px] text-gray-400">— Aucun</span>}
                    </div>

                    {/* Evolution */}
                    <div className="flex items-center justify-center gap-1.5">
                      {hasResults
                        ? <>
                            <span className={`text-[12px] font-bold tabular-nums ${delta > 0 ? 'text-green-500' : delta < 0 ? 'text-red-400' : 'text-gray-300'}`}>
                              {delta > 0 ? `▲${delta}` : delta < 0 ? `▼${Math.abs(delta)}` : '—0'}
                            </span>
                            <Sparkline pts={trd} color="#003087" w={46} h={20}/>
                          </>
                        : <span className="text-gray-200 text-[12px]">—</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Sidebar (~25%, fixed 272px) ──────────────────────────────── */}
          <div className="w-[272px] shrink-0 space-y-4">

            {/* Champions choisis */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[16px]">👑</span>
                <p className="font-condensed text-[14px] font-700 uppercase tracking-wide text-[#111827]">Champions choisis</p>
              </div>
              <div className="divide-y divide-gray-50">
                {champMap.map(([name, { flag, count }]) => (
                  <div key={name} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-[13px] text-[#111827] flex items-center gap-2">{flag} {name}</span>
                    <span className="font-condensed text-[16px] font-700 text-[#111827] tabular-nums">{count}</span>
                  </div>
                ))}
                {noChamp > 0 && (
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-[13px] text-gray-400">— Aucun</span>
                    <span className="font-condensed text-[16px] font-700 text-gray-300">{noChamp}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Meilleur joueur */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-2">
                <p className="font-condensed text-[14px] font-700 uppercase tracking-wide text-[#111827]">Meilleur joueur</p>
                <span className="text-[16px]">🔥</span>
              </div>
              <div className="px-4 py-4 flex items-center gap-4">
                <div className="rounded-full flex items-center justify-center font-800 font-condensed text-white shrink-0"
                  style={{ width: 56, height: 56, fontSize: 24, background: '#003087', boxShadow: '0 3px 10px rgba(0,48,135,.3)' }}>
                  {hasResults ? bestGood : '?'}
                </div>
                <div>
                  {hasResults
                    ? <><p className="text-[12px] text-gray-400 mb-0.5">bonnes prédictions</p><p className="text-[16px] font-semibold text-[#111827]">{bestPlayer?.pseudo ?? '—'}</p></>
                    : <p className="text-[12px] text-gray-400 leading-relaxed">Disponible au lancement du tournoi</p>}
                </div>
              </div>
            </div>

            {/* Écart avec 2ème */}
            {entries.length >= 2 && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3.5 border-b border-gray-100">
                  <p className="font-condensed text-[14px] font-700 uppercase tracking-wide text-[#111827]">
                    {amLeader ? 'Mon avance' : 'Écart avec 2ème'}
                  </p>
                </div>
                <div className="px-4 py-4">
                  {hasResults
                    ? <>
                        <p className="font-condensed text-[32px] font-800 text-green-500 leading-none">+{gapVal} pts</p>
                        <p className="text-[12px] text-gray-500 mt-0.5 mb-3">({gapSub})</p>
                        <Sparkline pts={gapTrend} color="#22c55e" w={230} h={44}/>
                      </>
                    : <p className="text-[13px] text-gray-400 py-2">Disponible au lancement du tournoi</p>}
                </div>
              </div>
            )}

            {/* Ma position */}
            {me && myRank > 0 && hasResults && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3.5 border-b border-gray-100">
                  <p className="font-condensed text-[14px] font-700 uppercase tracking-wide text-[#c8102e]">Ma position</p>
                </div>
                <div className="px-4 py-4 flex items-center justify-around">
                  <div className="text-center"><p className="font-condensed text-[38px] font-800 text-[#003087] leading-none">#{myRank}</p><p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">rang</p></div>
                  <div className="w-px h-12 bg-gray-200"/>
                  <div className="text-center"><p className="font-condensed text-[38px] font-800 text-[#c8102e] leading-none">{me.breakdown.total}</p><p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">pts</p></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 4 — BARÈME (full width)
        ════════════════════════════════════════════════════════════════════ */}
        <div className="px-6 md:px-10 pb-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px] text-gray-600">
          <span className="font-semibold text-gray-500 mr-1">Barème :</span>
          {[['Groupe','2 pts'],['16e','2 pts'],['1/8','5 pts'],['Quart','10 pts'],['Demi','15 pts'],['Finale','25 pts'],['3e place','10 pts']].map(([l,v],i,a) => (
            <span key={l} className="flex items-center gap-1">
              <span className="text-gray-500">{l}</span>
              <strong className="font-semibold text-[#003087]">{v}</strong>
              {i < a.length - 1 && <span className="text-gray-300 mx-1">|</span>}
            </span>
          ))}
        </div>

      </>)}

      {sel && <PlayerModal entry={sel} onClose={() => setSel(null)}/>}
    </div>
  )
}
