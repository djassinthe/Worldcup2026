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

// ─── Avatar color — deterministic per player ───────────────────────────────────

const AVATAR_PALETTE = [
  '#003087','#7c3aed','#16a34a','#d97706',
  '#dc2626','#0891b2','#6b7280','#db2777',
  '#0d9488','#9333ea',
]

function avatarBg(pseudo: string): string {
  let h = 0
  for (let i = 0; i < pseudo.length; i++) h = pseudo.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]
}

// ─── Sparkline SVG ─────────────────────────────────────────────────────────────

function Sparkline({ pts, color = '#003087', w = 52, h = 22 }: { pts: number[]; color?: string; w?: number; h?: number }) {
  if (pts.length < 2) return null
  const mn = Math.min(...pts); const mx = Math.max(...pts); const rng = mx - mn || 1
  const d = pts.map((v, i) => {
    const x = (i / (pts.length - 1)) * w
    const y = h - 2 - ((v - mn) / rng) * (h - 5)
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function trend(rank: number, total: number): number[] {
  const s = (total * 7 + rank * 13) % 97
  return [0,1,2,3,4].map(i => total - 12 + i * (rank <= 2 ? 2.8 : rank >= 5 ? -1.5 : 0.8) + Math.sin(s + i * 1.7) * 2.5)
}

// ─── Laurel badge ──────────────────────────────────────────────────────────────

function LaurelBadge({ sz = 52 }: { sz?: number }) {
  const leaf = '#c8960c'
  const pad = Math.round(sz * 0.55)
  return (
    <div className="relative flex items-center justify-center mb-3" style={{ width: sz + pad * 2, height: sz + 12 }}>
      <svg className="absolute" style={{ left: 0, top: 4, width: pad, height: sz + 4 }} viewBox="0 0 34 60" fill="none">
        <ellipse cx="24" cy="11" rx="6" ry="10" fill={leaf} transform="rotate(-38 24 11)" opacity=".9"/>
        <ellipse cx="19" cy="25" rx="6" ry="10" fill={leaf} transform="rotate(-20 19 25)" opacity=".9"/>
        <ellipse cx="17" cy="40" rx="5.5" ry="9" fill={leaf} transform="rotate(-4 17 40)" opacity=".85"/>
        <ellipse cx="20" cy="54" rx="5" ry="8" fill={leaf} transform="rotate(10 20 54)" opacity=".75"/>
      </svg>
      <div className="relative z-10 rounded-full flex items-center justify-center font-condensed font-800 text-white leading-none"
        style={{ width: sz, height: sz, fontSize: Math.round(sz * 0.38),
          background: 'linear-gradient(140deg,#fada5e 0%,#f5a623 45%,#c87800 100%)',
          boxShadow: '0 4px 18px rgba(245,166,35,.6),0 2px 6px rgba(0,0,0,.18)' }}>
        1
      </div>
      <svg className="absolute" style={{ right: 0, top: 4, width: pad, height: sz + 4 }} viewBox="0 0 34 60" fill="none">
        <ellipse cx="10" cy="11" rx="6" ry="10" fill={leaf} transform="rotate(38 10 11)" opacity=".9"/>
        <ellipse cx="15" cy="25" rx="6" ry="10" fill={leaf} transform="rotate(20 15 25)" opacity=".9"/>
        <ellipse cx="17" cy="40" rx="5.5" ry="9" fill={leaf} transform="rotate(4 17 40)" opacity=".85"/>
        <ellipse cx="14" cy="54" rx="5" ry="8" fill={leaf} transform="rotate(-10 14 54)" opacity=".75"/>
      </svg>
    </div>
  )
}

// ─── Modal ─────────────────────────────────────────────────────────────────────

function PlayerModal({ entry, onClose }: { entry: RankEntry; onClose: () => void }) {
  const d = entry.bracketData
  const champion = entry.champion
  const f0 = d ? getFinalTeam(d, 0) : null
  const f1 = d ? getFinalTeam(d, 1) : null
  const s0 = d ? getQuarterWinner(d, 0) : null
  const s1 = d ? getQuarterWinner(d, 1) : null
  const s2 = d ? getQuarterWinner(d, 2) : null
  const s3 = d ? getQuarterWinner(d, 3) : null
  const third = d ? getThirdPlace(d) : null
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])
  const av = avatarBg(entry.pseudo)
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"/>
      <div role="dialog" aria-modal="true"
        className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 flex items-center justify-between shrink-0" style={{ background: '#003087' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-[14px] uppercase text-white"
              style={{ background: av }}>{entry.pseudo[0]?.toUpperCase()}</div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Pronostic de</p>
              <p className="font-condensed text-[20px] font-700 uppercase tracking-wide text-white leading-tight">{entry.pseudo}</p>
            </div>
          </div>
          <button onClick={onClose} autoFocus aria-label="Fermer"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X size={16}/>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
          {!d ? <div className="px-6 py-12 text-center text-[13px] text-gray-400">Aucun bracket soumis.</div> : <>
            <div className="px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Champion</p>
              {champion
                ? <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <span className="text-3xl">{champion.flag}</span>
                    <span className="font-condensed text-[20px] font-700 uppercase text-amber-800">{champion.name}</span>
                  </div>
                : <p className="text-[13px] text-gray-400">Non sélectionné</p>}
            </div>
            <div className="px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Finale</p>
              <div className="grid grid-cols-2 gap-2">
                {[f0, f1].map((t, i) => t
                  ? <div key={i} className={`flex items-center gap-2 px-3 py-2 border rounded-lg ${champion?.name === t.name ? 'bg-[#003087] border-[#003087] text-white' : 'bg-gray-50 border-gray-200'}`}>
                      <span>{t.flag}</span><span className="text-[12px] font-semibold truncate">{t.name}</span>
                    </div>
                  : <div key={i} className="px-3 py-2 border border-dashed border-gray-200 rounded-lg text-[12px] text-gray-300">—</div>)}
              </div>
              {third && <p className="text-[12px] text-gray-500 mt-2"><span className="font-semibold text-gray-400">3e place :</span> {third.flag} {third.name}</p>}
            </div>
            <div className="px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Demi-finalistes</p>
              <div className="grid grid-cols-2 gap-2">
                {[s0, s1, s2, s3].map((t, i) => t
                  ? <div key={i} className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                      <span>{t.flag}</span><span className="text-[12px] font-medium text-[#003087] truncate">{t.name}</span>
                    </div>
                  : <div key={i} className="px-3 py-2 border border-dashed border-gray-200 rounded-lg text-[12px] text-gray-300">—</div>)}
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Qualifiés par groupe</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                {GROUPS.map(g => {
                  const q = d.groupQualified[g]; const teams = GROUP_TEAMS[g]
                  const t1 = teams?.[q?.[0]]; const t2 = q?.[1] !== -1 ? teams?.[q?.[1]] : null
                  const t3 = (q?.[2] !== undefined && q?.[2] !== -1) ? teams?.[q?.[2]] : null
                  return (
                    <div key={g}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Gr. {g}</p>
                      <div className="space-y-0.5">
                        {t1 && <p className="text-[12px] text-[#111827] font-medium">{t1.flag} {t1.name}</p>}
                        {t2 && <p className="text-[12px] text-gray-500">{t2.flag} {t2.name}</p>}
                        {t3 && <p className="text-[12px] text-gray-400">{t3.flag} {t3.name}</p>}
                      </div>
                    </div>
                  )
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

function PodiumCard({ entry, rank, onClick }: { entry: RankEntry; rank: 1|2|3; isMe?: boolean; onClick: () => void }) {
  const av = avatarBg(entry.pseudo)
  const r2 = { card: 'bg-white border border-gray-200 rounded-2xl shadow-sm', name: 'text-[18px]', pts: 'text-[#003087]', ptsSize: 'text-[22px]', champCol: 'text-gray-500' }
  const r3 = { card: 'border border-orange-200 rounded-2xl shadow-sm', cardBg: { background: 'linear-gradient(180deg,#fef6ee 0%,#fffaf6 100%)' }, name: 'text-[18px]', pts: 'text-[#c87333]', ptsSize: 'text-[22px]', champCol: 'text-gray-500' }
  if (rank === 1) {
    return (
      <button onClick={onClick}
        className="w-full rounded-2xl border-2 flex flex-col items-center pt-4 pb-6 px-4 hover:shadow-xl transition-all active:scale-[0.98] cursor-pointer"
        style={{ background: 'linear-gradient(180deg,#fef9e7 0%,#fffef5 100%)', borderColor: '#f5c842', minHeight: 252, boxShadow: '0 4px 20px rgba(245,166,35,.18)' }}>
        <LaurelBadge sz={52}/>
        <div className="w-13 h-13 rounded-full flex items-center justify-center text-[17px] font-black uppercase mb-2.5 shadow-md"
          style={{ width: 52, height: 52, background: av, color: '#fff' }}>
          {entry.pseudo[0]?.toUpperCase()}
        </div>
        <p className="font-condensed text-[22px] font-800 text-[#111827] mb-1 leading-tight">{entry.pseudo}</p>
        {entry.champion
          ? <p className="text-[14px] font-semibold mb-4 text-center" style={{ color: '#e8920f' }}>{entry.champion.flag} {entry.champion.name}</p>
          : <p className="text-[13px] text-gray-300 mb-4">—</p>}
        <div className="rounded-full px-7 py-2.5 shadow-sm" style={{ background: '#003087' }}>
          <span className="font-condensed text-[20px] font-800 text-white leading-none">{entry.breakdown.total} pts</span>
        </div>
      </button>
    )
  }
  const s = rank === 2 ? r2 : r3
  return (
    <button onClick={onClick}
      className={`w-full ${s.card} flex flex-col items-center pt-5 pb-5 px-4 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer`}
      style={{ minHeight: 212, ...('cardBg' in s && s.cardBg ? s.cardBg as React.CSSProperties : {}) }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center font-condensed font-800 text-white text-[18px] leading-none mb-4 shadow-sm"
        style={{
          background: rank === 2 ? 'linear-gradient(135deg,#cdd5e0 0%,#8a95a8 100%)' : 'linear-gradient(135deg,#d4924a 0%,#b87333 100%)',
          boxShadow: rank === 2 ? '0 2px 8px rgba(120,130,148,.4)' : '0 2px 8px rgba(184,115,51,.4)'
        }}>
        {rank}
      </div>
      <div className="w-11 h-11 rounded-full flex items-center justify-center text-[15px] font-black uppercase mb-2 shadow-sm"
        style={{ background: av, color: '#fff', width: 44, height: 44 }}>
        {entry.pseudo[0]?.toUpperCase()}
      </div>
      <p className={`font-condensed ${s.name} font-700 text-[#111827] mb-1 leading-tight`}>{entry.pseudo}</p>
      {entry.champion
        ? <p className={`text-[13px] ${s.champCol} mb-3 text-center`}>{entry.champion.flag} {entry.champion.name}</p>
        : <p className="text-[13px] text-gray-300 mb-3">—</p>}
      <p className={`font-condensed ${s.ptsSize} font-800 leading-none ${s.pts}`}>
        {entry.breakdown.total} <span className="text-[13px] font-normal">pts</span>
      </p>
    </button>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function daysUntil(d: string) {
  return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000))
}

function countGood(bd: ScoreBreakdown) {
  return [bd.groups, bd.r32, bd.r16, bd.quarters, bd.semis, bd.final, bd.thirdPlace].filter(v => v > 0).length
}

const TOURNAMENT_START = '2026-06-11'

const RANK_BADGE: Record<number, { bg: string; shadow: string }> = {
  1: { bg: 'linear-gradient(135deg,#f5c842 0%,#e8920f 60%,#c87800 100%)', shadow: '0 2px 8px rgba(245,166,35,.5)' },
  2: { bg: 'linear-gradient(135deg,#cdd5e0 0%,#8a95a8 100%)', shadow: '0 2px 6px rgba(120,130,148,.4)' },
  3: { bg: 'linear-gradient(135deg,#d4924a 0%,#b87333 100%)', shadow: '0 2px 6px rgba(184,115,51,.4)' },
}

const ROW_ACCENT: Record<number, string> = { 1: '#f5a623', 2: '#9ca3af', 3: '#cd7f32' }

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ClassementPage() {
  const { player } = useAuth()
  const [entries, setEntries] = useState<RankEntry[]>([])
  const [hasResults, setHasResults] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<RankEntry | null>(null)
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
        const anyR = real.r32.some((x: any) => x !== null) ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Object.values(real.groupQualified).some((q: any) => q[0] !== 0 || q[1] !== 1)
        setHasResults(anyR)
        const pm = new Map(preds.map(p => [p.player_id, migrateData(p.data)]))
        const ranked: RankEntry[] = players.map(p => {
          const bd = pm.get(p.id) ?? null
          return {
            player_id: p.id, pseudo: p.pseudo,
            breakdown: bd ? calculateScore(bd, real) : { groups: 0, r32: 0, r16: 0, quarters: 0, semis: 0, final: 0, thirdPlace: 0, total: 0 },
            champion: bd ? getChampion(bd) : null, bracketData: bd,
          }
        })
        if (anyR) ranked.sort((a, b) => b.breakdown.total - a.breakdown.total)
        else ranked.sort((a, b) => a.pseudo.localeCompare(b.pseudo))
        setEntries(ranked)
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    load()
  }, [])

  const me = entries.find(e => e.player_id === player?.id)
  const myRank = hasResults ? entries.findIndex(e => e.player_id === player?.id) + 1 : 0
  const leader = entries[0]; const second = entries[1]

  const champMap = useMemo(() => {
    const m = new Map<string, { flag: string; count: number }>()
    for (const e of entries) if (e.champion) {
      const x = m.get(e.champion.name)
      x ? x.count++ : m.set(e.champion.name, { flag: e.champion.flag, count: 1 })
    }
    return [...m.entries()].sort((a, b) => b[1].count - a[1].count)
  }, [entries])

  const noChamp = entries.filter(e => !e.bracketData).length
  const uniqueChamp = champMap.length
  const bestPlayer = useMemo(() => {
    if (!hasResults || !entries.length) return null
    return entries.reduce((b, e) => countGood(e.breakdown) > countGood(b.breakdown) ? e : b, entries[0])
  }, [entries, hasResults])
  const bestGood = bestPlayer ? countGood(bestPlayer.breakdown) : 0

  const gap = leader && second ? leader.breakdown.total - second.breakdown.total : 0
  const amLeader = leader?.player_id === player?.id
  const gapLabel = amLeader ? `+${gap} pts` : (me && leader) ? `+${leader.breakdown.total - me.breakdown.total} pts` : '—'
  const gapSub = amLeader ? `(${second?.pseudo ?? ''})` : `(${leader?.pseudo ?? ''})`
  const gapTrend = [gap - 3, gap - 1, gap + 2, gap + 5, gap + 7]

  const STATS = [
    { Icon: Users, val: String(entries.length), label: 'joueurs' },
    { Icon: Target, val: String(matchCount), label: 'matchs joués' },
    { Icon: Calendar, valTop: 'Début dans', val: days === 0 ? 'Aujourd\'hui' : `${days} jour${days > 1 ? 's' : ''}`, label: '', navyVal: true },
    { Icon: Trophy, val: String(uniqueChamp), label: 'champions différents' },
  ]

  return (
    <div className="bg-white min-h-full">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 pt-7 pb-6">
          <div className="flex items-start justify-between gap-6">

            {/* Title */}
            <div className="shrink-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#003087] mb-0.5">FIFA World Cup 2026</p>
              <h1 className="font-condensed text-[52px] font-800 uppercase tracking-wide text-[#111827] leading-none mb-2">
                Classement
              </h1>
              <p className="text-[13px] text-gray-500 leading-relaxed max-w-[340px]">
                {hasResults
                  ? 'Les scores sont calculés dès le coup d\'envoi du tournoi.\nCliquez sur un nom pour voir son pronostic complet.'
                  : 'Clique sur un nom pour voir son pronostic complet.'}
              </p>
            </div>

            {/* Stats chips */}
            <div className="flex items-stretch gap-0 border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white shrink-0">
              {STATS.map(({ Icon, val, label, valTop, navyVal }, idx) => (
                <div key={label || valTop} className={`flex items-center gap-3 px-5 py-4 ${idx < STATS.length - 1 ? 'border-r border-gray-200' : ''}`}>
                  <Icon size={22} className={idx === 3 ? 'text-[#f5a623]' : 'text-gray-400'} strokeWidth={1.8}/>
                  <div>
                    {valTop && <p className="text-[11px] text-gray-400 leading-none mb-0.5">{valTop}</p>}
                    <p className={`font-condensed text-[22px] font-800 leading-none ${navyVal ? 'text-[#003087]' : 'text-[#111827]'}`}>{val}</p>
                    {label && <p className="text-[11px] text-gray-400 leading-none mt-0.5">{label}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-5 h-5 border-2 border-[#003087] border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl px-6 py-16 text-center shadow-sm">
            <p className="text-[13px] text-gray-400">Aucun participant pour l'instant.</p>
          </div>
        ) : (
          <div className="flex items-start gap-5">

            {/* ── Main column ───────────────────────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-5">

              {/* Podium */}
              {entries.length >= 1 && (
                <div className="grid grid-cols-3 gap-3 items-end">
                  {entries[1]
                    ? <div style={{ paddingTop: 40 }}><PodiumCard entry={entries[1]} rank={2} isMe={entries[1].player_id === player?.id} onClick={() => setSelectedEntry(entries[1])}/></div>
                    : <div/>}
                  <PodiumCard entry={entries[0]} rank={1} isMe={entries[0].player_id === player?.id} onClick={() => setSelectedEntry(entries[0])}/>
                  {entries[2]
                    ? <div style={{ paddingTop: 64 }}><PodiumCard entry={entries[2]} rank={3} isMe={entries[2].player_id === player?.id} onClick={() => setSelectedEntry(entries[2])}/></div>
                    : <div/>}
                </div>
              )}

              {/* Table — ALL players */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="grid items-center px-4 py-3 bg-gray-50 border-b border-gray-200"
                  style={{ gridTemplateColumns: '52px 1fr 120px 150px 120px' }}>
                  {['#','JOUEUR','POINTS','CHAMPION','ÉVOLUTION'].map(h => (
                    <span key={h} className={`text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400 ${h === 'POINTS' || h === 'CHAMPION' ? 'text-center' : h === 'ÉVOLUTION' ? 'text-center' : ''}`}>{h}</span>
                  ))}
                </div>

                {entries.map((entry, i) => {
                  const rank = i + 1
                  const isCurrent = entry.player_id === player?.id
                  const badge = RANK_BADGE[rank]
                  const accent = ROW_ACCENT[rank]
                  const av = avatarBg(entry.pseudo)
                  const trd = trend(rank, entry.breakdown.total)
                  const delta = i === 0 ? 1 : i === 1 ? -1 : i === 4 ? -1 : i % 3 === 0 ? 1 : 0
                  const sparkColor = '#003087'

                  return (
                    <div key={entry.player_id}
                      className={`grid items-center px-4 border-b border-gray-100 last:border-0 cursor-pointer transition-colors
                        ${isCurrent ? 'bg-[#fef9e7]' : i % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-[#fafafa] hover:bg-gray-50'}`}
                      style={{
                        gridTemplateColumns: '52px 1fr 120px 150px 120px',
                        minHeight: 56,
                        borderLeft: accent ? `3px solid ${accent}` : undefined,
                      }}
                      onClick={() => setSelectedEntry(entry)}
                    >
                      {/* # */}
                      <div className="flex items-center">
                        {badge ? (
                          <div className="w-7 h-7 rounded-full flex items-center justify-center font-condensed font-800 text-white text-[13px] leading-none"
                            style={{ background: badge.bg, boxShadow: badge.shadow }}>
                            {rank}
                          </div>
                        ) : (
                          <span className="font-condensed text-[16px] font-600 text-gray-300 pl-1">{rank}</span>
                        )}
                      </div>

                      {/* Joueur */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="rounded-full flex items-center justify-center font-black text-[13px] uppercase text-white shrink-0 shadow-sm"
                          style={{ background: av, width: 32, height: 32 }}>
                          {entry.pseudo[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[14px] font-semibold truncate ${isCurrent ? 'text-[#003087]' : 'text-[#111827]'}`}>
                            {entry.pseudo}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full leading-none">moi</span>
                          )}
                        </div>
                      </div>

                      {/* Points */}
                      <div className="text-center">
                        <span className={`font-condensed text-[16px] font-700 tabular-nums ${isCurrent ? 'text-[#c8102e]' : hasResults ? 'text-[#111827]' : 'text-gray-200'}`}>
                          {hasResults ? (
                            <><strong className="font-800 text-[17px]">{entry.breakdown.total}</strong> <span className="text-[12px] font-normal text-gray-500">pts</span></>
                          ) : '—'}
                        </span>
                      </div>

                      {/* Champion */}
                      <div className="text-center">
                        {entry.champion
                          ? <span className="text-[13px] text-gray-700">{entry.champion.flag} {entry.champion.name}</span>
                          : <span className="text-[13px] text-gray-400">— Aucun</span>}
                      </div>

                      {/* Évolution */}
                      <div className="flex items-center justify-center gap-1.5">
                        {hasResults ? (
                          <>
                            <span className={`text-[12px] font-bold tabular-nums ${delta > 0 ? 'text-green-500' : delta < 0 ? 'text-red-400' : 'text-gray-300'}`}>
                              {delta > 0 ? `▲${delta}` : delta < 0 ? `▼${Math.abs(delta)}` : `—0`}
                            </span>
                            <Sparkline pts={trd} color={sparkColor} w={48} h={20}/>
                          </>
                        ) : <span className="text-gray-200 text-[12px]">—</span>}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Barème */}
              <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[12px] text-gray-700 px-1">
                <span className="font-semibold text-gray-600 mr-1">Barème :</span>
                {[['Groupe','2 pts'],['16e','2 pts'],['1/8','5 pts'],['Quart','10 pts'],['Demi','15 pts'],['Finale','25 pts'],['3e place','10 pts']].map(([l, v], i, arr) => (
                  <span key={l} className="flex items-center gap-1">
                    <span className="text-gray-500">{l}</span>
                    <strong className="font-semibold text-[#003087]">{v}</strong>
                    {i < arr.length - 1 && <span className="text-gray-300 mx-1">|</span>}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Sidebar ───────────────────────────────────────────────────── */}
            <div className="w-[268px] shrink-0 space-y-4">

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
                      <span className="font-condensed text-[15px] font-700 text-[#111827] tabular-nums">{count}</span>
                    </div>
                  ))}
                  {noChamp > 0 && (
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-[13px] text-gray-400">— Aucun</span>
                      <span className="font-condensed text-[15px] font-700 text-gray-300">{noChamp}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Meilleur joueur */}
              {entries.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-2">
                    <p className="font-condensed text-[14px] font-700 uppercase tracking-wide text-[#111827]">Meilleur joueur</p>
                    <span className="text-[16px]">🔥</span>
                  </div>
                  <div className="px-4 py-4 flex items-center gap-3.5">
                    <div className="rounded-full flex items-center justify-center font-800 font-condensed text-white shadow-md shrink-0"
                      style={{ background: '#003087', width: 52, height: 52, fontSize: 22 }}>
                      {hasResults ? bestGood : '?'}
                    </div>
                    <div>
                      {hasResults ? (
                        <>
                          <p className="text-[12px] text-gray-400 mb-0.5">bonnes prédictions</p>
                          <p className="text-[15px] font-semibold text-[#111827]">{bestPlayer?.pseudo ?? '—'}</p>
                        </>
                      ) : (
                        <p className="text-[12px] text-gray-400 leading-relaxed">Disponible au lancement du tournoi</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Écart */}
              {entries.length >= 2 && (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-4 py-3.5 border-b border-gray-100">
                    <p className="font-condensed text-[14px] font-700 uppercase tracking-wide text-[#111827]">
                      {amLeader ? 'Mon avance' : 'Écart avec 2ème'}
                    </p>
                  </div>
                  <div className="px-4 py-4">
                    {hasResults ? (
                      <>
                        <p className="font-condensed text-[32px] font-800 leading-none text-green-500">{gapLabel}</p>
                        <p className="text-[12px] text-gray-500 mt-0.5 mb-3">{gapSub}</p>
                        <Sparkline pts={gapTrend} color="#22c55e" w={220} h={44}/>
                      </>
                    ) : (
                      <p className="text-[12px] text-gray-400 py-2">Disponible au lancement du tournoi</p>
                    )}
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
                    <div className="text-center">
                      <p className="font-condensed text-[36px] font-800 text-[#003087] leading-none">#{myRank}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">rang</p>
                    </div>
                    <div className="w-px h-10 bg-gray-200"/>
                    <div className="text-center">
                      <p className="font-condensed text-[36px] font-800 text-[#c8102e] leading-none">{me.breakdown.total}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">pts</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {selectedEntry && <PlayerModal entry={selectedEntry} onClose={() => setSelectedEntry(null)}/>}
    </div>
  )
}
