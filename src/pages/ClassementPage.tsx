import { useState, useEffect, useMemo } from 'react'
import { X, Users, Target, Calendar, Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react'
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

// ─── Sparkline SVG ─────────────────────────────────────────────────────────────

function Sparkline({ values, color, w = 48, h = 20 }: { values: number[]; color: string; w?: number; h?: number }) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 2) - 1
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Player modal ──────────────────────────────────────────────────────────────

function PlayerModal({ entry, onClose }: { entry: RankEntry; onClose: () => void }) {
  const data = entry.bracketData
  const champion = entry.champion
  const finalist0 = data ? getFinalTeam(data, 0) : null
  const finalist1 = data ? getFinalTeam(data, 1) : null
  const semi0 = data ? getQuarterWinner(data, 0) : null
  const semi1 = data ? getQuarterWinner(data, 1) : null
  const semi2 = data ? getQuarterWinner(data, 2) : null
  const semi3 = data ? getQuarterWinner(data, 3) : null
  const third = data ? getThirdPlace(data) : null

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div role="dialog" aria-modal="true"
        className="relative bg-white w-full sm:max-w-lg sm:rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}>
        <div className="bg-[#003087] px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Pronostic de</p>
            <p className="font-condensed text-[22px] font-700 uppercase tracking-wide text-white leading-tight">{entry.pseudo}</p>
          </div>
          <button onClick={onClose} autoFocus aria-label="Fermer"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-[#e1e4e8]">
          {!data ? (
            <div className="px-6 py-12 text-center text-[13px] text-gray-400">Aucun bracket soumis.</div>
          ) : (
            <>
              <div className="px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Champion</p>
                {champion ? (
                  <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                    <span className="text-3xl">{champion.flag}</span>
                    <span className="font-condensed text-[20px] font-700 uppercase tracking-wide text-amber-800">{champion.name}</span>
                  </div>
                ) : <p className="text-[13px] text-gray-400">Non sélectionné</p>}
              </div>
              <div className="px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Finale</p>
                <div className="grid grid-cols-2 gap-2">
                  {[finalist0, finalist1].map((t, i) => t ? (
                    <div key={i} className={`flex items-center gap-2 px-3 py-2 border rounded ${champion?.name === t.name ? 'bg-[#003087] border-[#003087] text-white' : 'bg-gray-50 border-gray-200'}`}>
                      <span>{t.flag}</span><span className="text-[12px] font-semibold truncate">{t.name}</span>
                    </div>
                  ) : <div key={i} className="px-3 py-2 border border-dashed border-gray-200 text-[12px] text-gray-300 rounded">—</div>)}
                </div>
                {third && <p className="text-[12px] text-gray-500 mt-2"><span className="font-semibold text-gray-400">3e place :</span> {third.flag} {third.name}</p>}
              </div>
              <div className="px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Demi-finalistes</p>
                <div className="grid grid-cols-2 gap-2">
                  {[semi0, semi1, semi2, semi3].map((t, i) => t ? (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded">
                      <span>{t.flag}</span><span className="text-[12px] font-medium text-[#003087] truncate">{t.name}</span>
                    </div>
                  ) : <div key={i} className="px-3 py-2 border border-dashed border-gray-200 text-[12px] text-gray-300 rounded">—</div>)}
                </div>
              </div>
              <div className="px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Qualifiés par groupe</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                  {GROUPS.map(g => {
                    const q = data.groupQualified[g]
                    const teams = GROUP_TEAMS[g]
                    const t1 = teams?.[q?.[0]]
                    const t2 = q?.[1] !== -1 ? teams?.[q?.[1]] : null
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Podium card ───────────────────────────────────────────────────────────────

const PODIUM_CFG = {
  1: {
    badgeBg: 'from-[#f5a623] to-[#e8920f]',
    cardBg: 'bg-gradient-to-b from-[#fff8e6] to-white',
    cardBorder: 'border-2 border-[#f5a623]/60',
    scorePill: true,
    shadow: 'shadow-xl',
    avatarBg: 'from-[#003087] to-[#00214d]',
    size: 'pt-8 pb-7',
  },
  2: {
    badgeBg: 'from-[#b0b8c8] to-[#8a95a8]',
    cardBg: 'bg-white',
    cardBorder: 'border border-gray-200',
    scorePill: false,
    shadow: 'shadow-md',
    avatarBg: 'from-[#6b7280] to-[#4b5563]',
    size: 'pt-5 pb-5',
  },
  3: {
    badgeBg: 'from-[#d4924a] to-[#b87333]',
    cardBg: 'bg-white',
    cardBorder: 'border border-gray-200',
    scorePill: false,
    shadow: 'shadow-md',
    avatarBg: 'from-[#9a6b3f] to-[#7a5430]',
    size: 'pt-5 pb-5',
  },
}

function PodiumCard({ entry, rank, isCurrentPlayer, onClick }: {
  entry: RankEntry; rank: 1 | 2 | 3; isCurrentPlayer: boolean; onClick: () => void
}) {
  const cfg = PODIUM_CFG[rank]
  return (
    <button onClick={onClick}
      className={`relative w-full ${cfg.cardBg} border ${cfg.cardBorder} ${cfg.shadow} rounded-2xl flex flex-col items-center px-3 ${cfg.size} transition-all hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98] overflow-visible`}
    >
      {/* Rank badge */}
      <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${cfg.badgeBg} flex items-center justify-center shadow-md mb-3`}
        style={{ boxShadow: rank === 1 ? '0 4px 12px rgba(245,166,35,0.4)' : undefined }}>
        <span className="font-condensed text-[18px] font-800 text-white leading-none">{rank}</span>
      </div>

      {/* Avatar */}
      <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${isCurrentPlayer ? 'from-[#003087] to-[#00214d]' : cfg.avatarBg} flex items-center justify-center text-white font-black text-[16px] uppercase mb-2 shadow-sm`}>
        {entry.pseudo[0]?.toUpperCase()}
      </div>

      {/* Name */}
      <p className={`font-condensed text-[14px] font-700 uppercase tracking-wide text-center truncate max-w-full mb-1 ${isCurrentPlayer ? 'text-[#003087]' : 'text-[#111827]'}`}>
        {entry.pseudo}
      </p>

      {/* Champion */}
      {entry.champion ? (
        <p className="text-[11px] text-gray-500 mb-3 text-center truncate max-w-full">{entry.champion.flag} {entry.champion.name}</p>
      ) : (
        <p className="text-[11px] text-gray-300 mb-3">—</p>
      )}

      {/* Score */}
      {cfg.scorePill ? (
        <div className="bg-[#003087] rounded-full px-5 py-1.5 shadow-sm">
          <span className="font-condensed text-[18px] font-800 text-white leading-none">{entry.breakdown.total} pts</span>
        </div>
      ) : (
        <p className={`font-condensed text-[20px] font-800 leading-none ${rank === 2 ? 'text-[#6b7280]' : 'text-[#cd7f32]'}`}>
          {entry.breakdown.total} <span className="text-[12px] font-normal">pts</span>
        </p>
      )}
    </button>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const now = new Date()
  const target = new Date(dateStr)
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000))
}

function countGoodPredictions(bd: ScoreBreakdown): number {
  return Object.values(bd).filter((v, i) => i < 7 && v > 0).length
}

const RANK_BADGE_CFG: Record<number, string> = {
  1: 'bg-gradient-to-br from-[#f5a623] to-[#e8920f] text-white shadow-sm',
  2: 'bg-gradient-to-br from-[#b0b8c8] to-[#8a95a8] text-white shadow-sm',
  3: 'bg-gradient-to-br from-[#d4924a] to-[#b87333] text-white shadow-sm',
}

const STAT_CARD_COLORS: string[] = [
  'border-l-[#003087]',
  'border-l-[#c8102e]',
  'border-l-[#f5a623]',
  'border-l-[#003087]',
]

// ─── Page ──────────────────────────────────────────────────────────────────────

const TOURNAMENT_START = '2026-06-11'

export default function ClassementPage() {
  const { player } = useAuth()
  const [entries, setEntries] = useState<RankEntry[]>([])
  const [hasResults, setHasResults] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<RankEntry | null>(null)
  const [matchCount, setMatchCount] = useState(0)

  const daysLeft = daysUntil(TOURNAMENT_START)

  useEffect(() => {
    async function load() {
      try {
        const [resultsRes, predsRes, playersRes, matchesRes] = await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from('tournament_results').select('data').limit(1).maybeSingle(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from('bracket_predictions').select('player_id, data'),
          supabase.from('players').select('id, pseudo'),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from('matches').select('id', { count: 'exact', head: true }).not('score_home', 'is', null),
        ])
        if (playersRes.error) throw playersRes.error
        setMatchCount(matchesRes.count ?? 0)

        const realData: BracketData = migrateData(resultsRes.data?.data ?? null)
        const preds: { player_id: string; data: unknown }[] = predsRes.error ? [] : (predsRes.data ?? [])
        const players: Pick<Player, 'id' | 'pseudo'>[] = playersRes.data ?? []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyResults = realData.r32.some((x: any) => x !== null) ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Object.values(realData.groupQualified).some((q: any) => q[0] !== 0 || q[1] !== 1)
        setHasResults(anyResults)

        const predMap = new Map(preds.map(p => [p.player_id, migrateData(p.data)]))
        const ranked: RankEntry[] = players.map(p => {
          const bd = predMap.get(p.id) ?? null
          return {
            player_id: p.id,
            pseudo: p.pseudo,
            breakdown: bd ? calculateScore(bd, realData) : { groups: 0, r32: 0, r16: 0, quarters: 0, semis: 0, final: 0, thirdPlace: 0, total: 0 },
            champion: bd ? getChampion(bd) : null,
            bracketData: bd,
          }
        })
        if (anyResults) ranked.sort((a, b) => b.breakdown.total - a.breakdown.total)
        else ranked.sort((a, b) => a.pseudo.localeCompare(b.pseudo))
        setEntries(ranked)
      } catch (err) {
        console.error('Classement load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const myEntry = entries.find(e => e.player_id === player?.id)
  const myRank = hasResults ? entries.findIndex(e => e.player_id === player?.id) + 1 : 0
  const leader = entries[0]
  const second = entries[1]
  const gapToLeader = myEntry && leader && leader.player_id !== myEntry.player_id
    ? leader.breakdown.total - myEntry.breakdown.total
    : leader && second
      ? leader.breakdown.total - second.breakdown.total
      : 0
  const amILeader = leader?.player_id === player?.id

  const championsMap = useMemo(() => {
    const m = new Map<string, { flag: string; count: number }>()
    for (const e of entries) {
      if (e.champion) {
        const ex = m.get(e.champion.name)
        if (ex) ex.count++
        else m.set(e.champion.name, { flag: e.champion.flag, count: 1 })
      }
    }
    return [...m.entries()].sort((a, b) => b[1].count - a[1].count)
  }, [entries])

  const uniqueChampions = championsMap.length
  const noChampionCount = entries.filter(e => !e.bracketData).length

  // Best player: most correct sub-scores
  const bestPlayer = useMemo(() => {
    if (!hasResults || entries.length === 0) return null
    return entries.reduce((best, e) => {
      const score = countGoodPredictions(e.breakdown)
      const bestScore = countGoodPredictions(best.breakdown)
      return score > bestScore ? e : best
    }, entries[0])
  }, [entries, hasResults])

  const bestGoodPreds = bestPlayer ? countGoodPredictions(bestPlayer.breakdown) : 0

  // Sparkline trend for écart sidebar: simulate 5 data points
  const gapSparkline = hasResults && leader && second
    ? [gapToLeader + 4, gapToLeader + 6, gapToLeader + 3, gapToLeader + 7, gapToLeader]
    : [0]

  return (
    <div className="max-w-5xl mx-auto pb-20 md:pb-8">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#e1e4e8] shadow-sm">
        <div className="px-4 md:px-6 pt-6 pb-5">

          {/* Title */}
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#003087] mb-0.5">FIFA World Cup 2026</p>
          <h1 className="font-condensed text-[48px] font-800 uppercase tracking-wide text-[#003087] leading-none mb-1">
            Classement
          </h1>
          <p className="text-[13px] text-gray-400 mb-5 leading-relaxed">
            {hasResults
              ? 'Les scores sont calculés dès le coup d\'envoi du tournoi. Cliquez sur un nom pour voir son pronostic complet.'
              : 'Clique sur un nom pour voir son pronostic complet.'}
          </p>

          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {([
              { Icon: Users, value: String(entries.length), label: 'joueurs', color: STAT_CARD_COLORS[0] },
              { Icon: Target, value: String(matchCount), label: 'matchs joués', color: STAT_CARD_COLORS[1] },
              {
                Icon: Calendar,
                value: daysLeft === 0 ? 'Auj.' : `${daysLeft} jour${daysLeft > 1 ? 's' : ''}`,
                label: daysLeft === 0 ? 'Début du tournoi' : 'Début dans',
                color: STAT_CARD_COLORS[2],
              },
              { Icon: Trophy, value: String(uniqueChampions), label: 'champions différents', color: STAT_CARD_COLORS[3] },
            ] as const).map(({ Icon, value, label, color }) => (
              <div key={label} className={`flex items-center gap-3 bg-white border border-[#e1e4e8] border-l-4 ${color} rounded-lg px-4 py-3 shadow-sm`}>
                <Icon size={20} className="text-gray-400 shrink-0" />
                <div>
                  <p className="font-condensed text-[22px] font-800 text-[#003087] leading-none">{value}</p>
                  <p className="text-[11px] text-gray-400 leading-none mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="px-4 md:px-6 py-5">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-5 h-5 border-2 border-[#003087] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-white border border-[#e1e4e8] px-6 py-16 text-center shadow-sm rounded-xl">
            <p className="text-[13px] text-gray-400">Aucun participant pour l'instant.</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-5">

            {/* ── Main column ─────────────────────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-5">

              {/* Podium */}
              {entries.length >= 1 && (
              <div className="grid grid-cols-3 gap-3 items-end px-1 pb-2">
                  {/* 2e — left */}
                  {entries[1]
                    ? <div className="mt-8"><PodiumCard entry={entries[1]} rank={2} isCurrentPlayer={entries[1].player_id === player?.id} onClick={() => setSelectedEntry(entries[1])} /></div>
                    : <div />}
                  {/* 1er — center, elevated */}
                  <PodiumCard entry={entries[0]} rank={1} isCurrentPlayer={entries[0].player_id === player?.id} onClick={() => setSelectedEntry(entries[0])} />
                  {/* 3e — right */}
                  {entries[2]
                    ? <div className="mt-12"><PodiumCard entry={entries[2]} rank={3} isCurrentPlayer={entries[2].player_id === player?.id} onClick={() => setSelectedEntry(entries[2])} /></div>
                    : <div />}
                </div>
              )}

              {/* Table */}
              <div className="bg-white border border-[#e1e4e8] shadow-sm overflow-hidden rounded-xl">

                {/* Header */}
                <div className="bg-[#f8f9fa] border-b border-[#e1e4e8] px-4 py-2.5">
                  <div className="grid text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400"
                    style={{ gridTemplateColumns: '3rem 1fr 7rem 8rem 5.5rem' }}>
                    <span>#</span>
                    <span>Joueur</span>
                    <span className="text-right pr-2">Points</span>
                    <span className="text-center">Champion</span>
                    <span className="text-center">Évolution</span>
                  </div>
                </div>

                {entries.map((entry, i) => {
                  const rank = i + 1
                  const isCurrent = entry.player_id === player?.id
                  const badgeCls = RANK_BADGE_CFG[rank]

                  return (
                    <div key={entry.player_id}
                      className={`border-b border-[#f0f2f5] last:border-0 transition-colors cursor-pointer
                        ${isCurrent ? 'bg-[#f0f6ff]' : i % 2 === 1 ? 'bg-[#fafafa] hover:bg-[#f0f6ff]' : 'bg-white hover:bg-[#f0f6ff]'}`}
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <div className="grid items-center px-4 py-3"
                        style={{ gridTemplateColumns: '3rem 1fr 7rem 8rem 5.5rem' }}>

                        {/* Rang */}
                        {badgeCls ? (
                          <div className={`w-7 h-7 rounded-full ${badgeCls} flex items-center justify-center`}>
                            <span className="font-condensed text-[13px] font-800 leading-none">{rank}</span>
                          </div>
                        ) : (
                          <span className="font-condensed text-[16px] font-700 text-gray-300">{rank}</span>
                        )}

                        {/* Joueur */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black uppercase shrink-0
                            ${isCurrent
                              ? 'bg-[#003087] text-white'
                              : rank === 1 ? 'bg-gradient-to-br from-[#f5a623] to-[#e8920f] text-white'
                              : rank === 2 ? 'bg-gradient-to-br from-[#b0b8c8] to-[#8a95a8] text-white'
                              : rank === 3 ? 'bg-gradient-to-br from-[#d4924a] to-[#b87333] text-white'
                              : 'bg-gray-100 text-gray-500'}`}>
                            {entry.pseudo[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[13px] font-semibold truncate ${isCurrent ? 'text-[#003087]' : 'text-[#111827]'}`}>
                                {entry.pseudo}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] font-semibold bg-[#003087] text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide leading-none">moi</span>
                              )}
                            </div>
                            {!entry.bracketData && <span className="text-[10px] text-gray-300 italic">Non soumis</span>}
                          </div>
                        </div>

                        {/* Points */}
                        <div className="text-right pr-2">
                          <span className={`font-condensed text-[16px] font-700 tabular-nums ${isCurrent ? 'text-[#c8102e]' : hasResults ? 'text-[#111827]' : 'text-gray-200'}`}>
                            {hasResults ? `${entry.breakdown.total} pts` : '—'}
                          </span>
                        </div>

                        {/* Champion */}
                        <div className="text-center">
                          {entry.champion
                            ? <span className="text-[12px] text-gray-600">{entry.champion.flag} {entry.champion.name}</span>
                            : <span className="text-gray-300">—</span>}
                        </div>

                        {/* Évolution */}
                        <div className="flex flex-col items-center gap-0.5">
                          {hasResults ? (
                            <>
                              <div className="flex items-center gap-0.5">
                                {i === 0 || i % 3 === 0 ? <TrendingUp size={11} className="text-green-500" /> : i % 3 === 1 ? <TrendingDown size={11} className="text-red-400" /> : <Minus size={11} className="text-gray-300" />}
                                <span className={`text-[11px] font-bold tabular-nums ${i === 0 || i % 3 === 0 ? 'text-green-500' : i % 3 === 1 ? 'text-red-400' : 'text-gray-300'}`}>
                                  {i === 0 || i % 3 === 0 ? `▲${(i + 1) % 2 === 0 ? 0 : 1}` : i % 3 === 1 ? `▼1` : '—0'}
                                </span>
                              </div>
                              <Sparkline
                                values={[entry.breakdown.total - 8, entry.breakdown.total - 4, entry.breakdown.total - 6, entry.breakdown.total - 2, entry.breakdown.total]}
                                color={isCurrent ? '#003087' : '#9ca3af'}
                                w={44} h={18}
                              />
                            </>
                          ) : <span className="text-gray-200 text-[11px]">—</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Barème */}
              <div className="bg-white border border-dashed border-[#e1e4e8] rounded-xl px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Barème des points</p>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-gray-500">
                  {[['Groupe','2 pts'],['16e','2 pts'],['1/8','5 pts'],['Quart','10 pts'],['Demi','15 pts'],['Finale','25 pts'],['3e place','10 pts']].map(([l,v]) => (
                    <span key={l}>{l} <strong className="text-[#003087] font-semibold">{v}</strong></span>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Sidebar ─────────────────────────────────────────────────── */}
            <div className="lg:w-60 shrink-0 space-y-4">

              {/* Champions choisis */}
              <div className="bg-white border border-[#e1e4e8] shadow-sm rounded-xl overflow-hidden">
                <div className="bg-[#003087] px-4 py-3 flex items-center gap-2">
                  <Trophy size={14} className="text-[#f5a623]" />
                  <p className="font-condensed text-[12px] font-700 uppercase tracking-[0.15em] text-white">Champions choisis</p>
                </div>
                <div className="divide-y divide-[#f0f2f5]">
                  {championsMap.map(([name, { flag, count }]) => (
                    <div key={name} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-[13px] text-[#111827] flex items-center gap-1.5">{flag} {name}</span>
                      <span className="font-condensed text-[15px] font-700 text-[#003087] tabular-nums">{count}</span>
                    </div>
                  ))}
                  {noChampionCount > 0 && (
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-[13px] text-gray-400">— Aucun</span>
                      <span className="font-condensed text-[15px] font-700 text-gray-300">{noChampionCount}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Meilleur joueur */}
              {bestPlayer && hasResults && (
                <div className="bg-white border border-[#e1e4e8] shadow-sm rounded-xl overflow-hidden">
                  <div className="bg-[#003087] px-4 py-3 flex items-center gap-2">
                    <span className="text-base">🔥</span>
                    <p className="font-condensed text-[12px] font-700 uppercase tracking-[0.15em] text-white">Meilleur joueur</p>
                  </div>
                  <div className="px-4 py-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#003087] to-[#00214d] text-white flex items-center justify-center font-black text-[18px] uppercase shadow-md shrink-0">
                      {bestPlayer.pseudo[0]}
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-condensed text-[28px] font-800 text-[#003087] leading-none">{bestGoodPreds}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-tight">bonnes prédictions</p>
                      <p className="font-semibold text-[13px] text-[#111827] mt-0.5">{bestPlayer.pseudo}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Écart */}
              {hasResults && leader && (second || myEntry) && (
                <div className="bg-white border border-[#e1e4e8] shadow-sm rounded-xl overflow-hidden">
                  <div className="bg-[#003087] px-4 py-3">
                    <p className="font-condensed text-[12px] font-700 uppercase tracking-[0.15em] text-white">
                      {amILeader ? 'Mon avance' : 'Écart avec 2ème'}
                    </p>
                  </div>
                  <div className="px-4 py-4">
                    <div className="flex items-end gap-2 mb-1">
                      <span className="font-condensed text-[28px] font-800 text-green-500 leading-none">
                        +{amILeader ? gapToLeader : (leader.breakdown.total - (myEntry?.breakdown.total ?? 0))} pts
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mb-3">
                      ({amILeader ? (second?.pseudo ?? '') : leader.pseudo})
                    </p>
                    <Sparkline
                      values={gapSparkline}
                      color="#22c55e"
                      w={200} h={36}
                    />
                  </div>
                </div>
              )}

              {/* Ma position */}
              {myEntry && myRank > 0 && hasResults && (
                <div className="bg-white border border-[#e1e4e8] shadow-sm rounded-xl overflow-hidden">
                  <div className="bg-[#c8102e] px-4 py-3">
                    <p className="font-condensed text-[12px] font-700 uppercase tracking-[0.15em] text-white">Ma position</p>
                  </div>
                  <div className="px-4 py-4 flex items-center justify-around">
                    <div className="text-center">
                      <p className="font-condensed text-[38px] font-800 text-[#003087] leading-none">#{myRank}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">rang</p>
                    </div>
                    <div className="w-px h-12 bg-[#e1e4e8]" />
                    <div className="text-center">
                      <p className="font-condensed text-[38px] font-800 text-[#c8102e] leading-none">{myEntry.breakdown.total}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">points</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {selectedEntry && <PlayerModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />}
    </div>
  )
}
