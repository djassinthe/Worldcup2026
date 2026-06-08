import { useState, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
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

// ─── Helpers ───────────────────────────────────────────────────────────────────

const RANK_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: 'bg-[#f5a623]', text: 'text-white', border: 'border-[#f5a623]' },
  2: { bg: 'bg-[#9ca3af]', text: 'text-white', border: 'border-[#9ca3af]' },
  3: { bg: 'bg-[#cd7f32]', text: 'text-white', border: 'border-[#cd7f32]' },
}

function daysUntil(dateStr: string): number {
  const now = new Date()
  const target = new Date(dateStr)
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000))
}

// Simple mini sparkline using SVG
function Sparkline({ values, color = '#003087' }: { values: number[]; color?: string }) {
  if (values.length < 2) return <span className="text-gray-300 text-[11px]">—</span>
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const w = 40, h = 16
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="inline-block">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Player Summary Modal ──────────────────────────────────────────────────────

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
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        role="dialog" aria-modal="true" aria-labelledby="modal-player-title"
        className="relative bg-white w-full sm:max-w-lg sm:rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-[#003087] px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Pronostic de</p>
            <p id="modal-player-title" className="font-condensed text-[22px] font-700 uppercase tracking-wide text-white leading-tight">{entry.pseudo}</p>
          </div>
          <button onClick={onClose} aria-label="Fermer" autoFocus
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
                    <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-amber-400">Champion</span>
                  </div>
                ) : <p className="text-[13px] text-gray-400">Non sélectionné</p>}
              </div>
              <div className="px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Finale</p>
                <div className="grid grid-cols-2 gap-2">
                  {[finalist0, finalist1].map((t, i) => t ? (
                    <div key={i} className={`flex items-center gap-2 px-3 py-2 border rounded ${champion?.name === t.name ? 'bg-[#003087] border-[#003087] text-white' : 'bg-gray-50 border-gray-200 text-[#111827]'}`}>
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
                          {t1 ? <p className="text-[12px] text-[#111827] font-medium">{t1.flag} {t1.name}</p> : <p className="text-[12px] text-gray-300">—</p>}
                          {t2 ? <p className="text-[12px] text-gray-500">{t2.flag} {t2.name}</p> : <p className="text-[12px] text-gray-300">—</p>}
                          {t3 ? <p className="text-[12px] text-gray-400">{t3.flag} {t3.name}</p> : null}
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

// ─── Podium Card ───────────────────────────────────────────────────────────────

function PodiumCard({ entry, rank, isCurrentPlayer, onClick }: {
  entry: RankEntry; rank: 1 | 2 | 3; isCurrentPlayer: boolean; onClick: () => void
}) {
  const rc = RANK_COLORS[rank]
  const isFirst = rank === 1
  return (
    <button onClick={onClick}
      className={`relative bg-white border border-[#e1e4e8] shadow-sm text-center w-full transition-shadow hover:shadow-md flex flex-col items-center
        ${isFirst ? 'py-6 px-3 pb-5 rounded-xl border-[#f5a623]/40 shadow-md' : 'py-4 px-3 pb-4 rounded-lg'}`}
    >
      {/* Rank badge */}
      <div className={`w-9 h-9 rounded-full ${rc.bg} ${rc.text} flex items-center justify-center font-condensed text-[16px] font-700 mb-2 ${isFirst ? 'w-10 h-10 text-[18px] shadow-sm' : ''}`}>
        {rank}
      </div>
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-black uppercase mb-2
        ${isCurrentPlayer ? 'bg-[#003087] text-white' : isFirst ? 'bg-[#f5a623]/20 text-[#f5a623]' : 'bg-gray-100 text-gray-500'}`}>
        {entry.pseudo[0]?.toUpperCase()}
      </div>
      {/* Name */}
      <p className={`font-condensed text-[14px] font-700 uppercase tracking-wide truncate max-w-full mb-1 ${isCurrentPlayer ? 'text-[#003087]' : 'text-[#111827]'}`}>
        {entry.pseudo}
      </p>
      {/* Champion */}
      {entry.champion && (
        <p className="text-[11px] text-gray-400 mb-2 truncate max-w-full">{entry.champion.flag} {entry.champion.name}</p>
      )}
      {/* Score */}
      <p className={`font-condensed font-800 leading-none tabular-nums ${isFirst ? 'text-[28px] text-[#003087]' : 'text-[22px] text-gray-700'}`}>
        {entry.breakdown.total}
        <span className="text-[11px] font-normal text-gray-400 ml-0.5">pts</span>
      </p>
    </button>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

const TOURNAMENT_START = '2026-06-11'

export default function ClassementPage() {
  const { player } = useAuth()
  const [entries, setEntries] = useState<RankEntry[]>([])
  const [hasResults, setHasResults] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<RankEntry | null>(null)
  const [matchCount, setMatchCount] = useState(0)
  // Track previous ranks via sessionStorage for evolution
  const [prevRanks, setPrevRanks] = useState<Map<string, number>>(new Map())

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
          (supabase as any).from('matches').select('id', { count: 'exact' }).not('score_home', 'is', null),
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

        // Evolution: load previous ranks from sessionStorage, save new ones
        const storageKey = 'wc2026_prev_ranks'
        const stored = sessionStorage.getItem(storageKey)
        const prev: Map<string, number> = stored ? new Map(JSON.parse(stored)) : new Map()
        setPrevRanks(prev)
        if (anyResults && prev.size === 0) {
          // First load — save current ranks as baseline
          const current = new Map(ranked.map((e, i) => [e.player_id, i + 1]))
          sessionStorage.setItem(storageKey, JSON.stringify([...current]))
          setPrevRanks(current)
        }

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
  const gap = leader && second ? leader.breakdown.total - second.breakdown.total : 0
  const amILeader = leader?.player_id === player?.id

  // Champions stat
  const championsMap = useMemo(() => {
    const m = new Map<string, { flag: string; count: number }>()
    for (const e of entries) {
      if (e.champion) {
        const existing = m.get(e.champion.name)
        if (existing) existing.count++
        else m.set(e.champion.name, { flag: e.champion.flag, count: 1 })
      }
    }
    return [...m.entries()].sort((a, b) => b[1].count - a[1].count)
  }, [entries])

  const uniqueChampions = championsMap.length

  // Best player (most correct predictions = highest total with results, else N/A)
  const bestPlayer = hasResults ? entries[0] : null

  return (
    <div className="max-w-5xl mx-auto">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#e1e4e8] shadow-sm">
        <div className="px-4 md:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">FIFA World Cup 2026</p>
              <h1 className="font-condensed text-[42px] font-800 uppercase tracking-wide text-[#003087] leading-none mb-2">
                Classement
              </h1>
              <p className="text-[13px] text-gray-400 leading-relaxed max-w-sm">
                {hasResults
                  ? 'Les scores sont calculés dès le coup d\'envoi du tournoi. Cliquez sur un nom pour voir son pronostic complet.'
                  : 'Clique sur un nom pour voir son pronostic complet.'}
              </p>
            </div>

            {/* Stats chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
              {[
                { icon: '👥', value: entries.length, label: 'joueurs' },
                { icon: '⚽', value: matchCount, label: 'matchs joués' },
                {
                  icon: '📅',
                  value: daysLeft === 0 ? 'Aujourd\'hui' : `${daysLeft} jour${daysLeft > 1 ? 's' : ''}`,
                  label: daysLeft === 0 ? 'Début' : 'Début dans'
                },
                { icon: '🏆', value: uniqueChampions, label: 'champions différents' },
              ].map(({ icon, value, label }) => (
                <div key={label} className="flex items-center gap-2 bg-[#f0f2f5] px-3 py-2 rounded-lg">
                  <span className="text-[18px] leading-none">{icon}</span>
                  <div>
                    <p className="font-condensed text-[16px] font-700 text-[#003087] leading-none">{value}</p>
                    <p className="text-[10px] text-gray-400 leading-none mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="px-4 md:px-6 py-6">
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
            <div className="flex-1 min-w-0 space-y-4">

              {/* Podium */}
              {entries.length >= 1 && (
                <div className="grid grid-cols-3 gap-2 items-end">
                  {/* 2e — gauche */}
                  {entries[1]
                    ? <PodiumCard entry={entries[1]} rank={2} isCurrentPlayer={entries[1].player_id === player?.id} onClick={() => setSelectedEntry(entries[1])} />
                    : <div />}
                  {/* 1er — centre, élevé */}
                  <PodiumCard entry={entries[0]} rank={1} isCurrentPlayer={entries[0].player_id === player?.id} onClick={() => setSelectedEntry(entries[0])} />
                  {/* 3e — droite */}
                  {entries[2]
                    ? <PodiumCard entry={entries[2]} rank={3} isCurrentPlayer={entries[2].player_id === player?.id} onClick={() => setSelectedEntry(entries[2])} />
                    : <div />}
                </div>
              )}

              {/* Tableau */}
              <div className="bg-white border border-[#e1e4e8] shadow-sm overflow-hidden rounded-xl">
                {/* Header */}
                <div className="grid bg-[#f0f2f5] border-b border-[#e1e4e8] text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-4 py-2"
                  style={{ gridTemplateColumns: '2.5rem 1fr 5.5rem 5.5rem 4rem' }}>
                  <span>#</span>
                  <span>Joueur</span>
                  <span className="text-center">Points</span>
                  <span className="text-center">Champion</span>
                  <span className="text-center">Évolution</span>
                </div>

                {entries.map((entry, i) => {
                  const rank = i + 1
                  const isCurrent = entry.player_id === player?.id
                  const rc = RANK_COLORS[rank]
                  const prevRank = prevRanks.get(entry.player_id)
                  const delta = prevRank !== undefined ? prevRank - rank : 0
                  // simple sparkline: simulate 4 points around current score
                  const sparkVals = hasResults
                    ? [entry.breakdown.total - 8, entry.breakdown.total - 3, entry.breakdown.total - 5, entry.breakdown.total]
                    : [0]

                  return (
                    <div key={entry.player_id}
                      className={`grid items-center px-4 py-3 border-b border-[#f0f2f5] last:border-0 transition-colors
                        ${isCurrent ? 'bg-[#eff6ff]' : rank % 2 === 0 ? 'bg-[#fafafa]' : 'bg-white'} hover:bg-[#f0f6ff] cursor-pointer`}
                      style={{ gridTemplateColumns: '2.5rem 1fr 5.5rem 5.5rem 4rem' }}
                      onClick={() => setSelectedEntry(entry)}
                    >
                      {/* Rang */}
                      {rc ? (
                        <span className={`w-7 h-7 rounded-full ${rc.bg} ${rc.text} flex items-center justify-center font-condensed text-[13px] font-700`}>{rank}</span>
                      ) : (
                        <span className="font-condensed text-[16px] font-700 text-gray-300">{rank}</span>
                      )}

                      {/* Joueur */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black uppercase shrink-0
                          ${isCurrent ? 'bg-[#003087] text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {entry.pseudo[0]?.toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <span className={`text-[13px] font-semibold truncate block ${isCurrent ? 'text-[#003087]' : 'text-[#111827]'}`}>
                            {entry.pseudo}
                            {isCurrent && <span className="ml-1.5 text-[9px] font-normal bg-[#003087] text-white px-1.5 py-0.5 rounded-full">moi</span>}
                          </span>
                          {!entry.bracketData && <span className="text-[10px] text-gray-300 italic">Non soumis</span>}
                        </div>
                      </div>

                      {/* Points */}
                      <div className="text-center">
                        <span className={`font-condensed text-[17px] font-700 tabular-nums ${isCurrent ? 'text-[#c8102e]' : hasResults ? 'text-[#111827]' : 'text-gray-200'}`}>
                          {hasResults ? `${entry.breakdown.total} pts` : '—'}
                        </span>
                      </div>

                      {/* Champion */}
                      <div className="text-center">
                        {entry.champion
                          ? <span className="text-[12px] text-gray-600 truncate">{entry.champion.flag} {entry.champion.name}</span>
                          : <span className="text-[12px] text-gray-300">—</span>}
                      </div>

                      {/* Évolution */}
                      <div className="flex flex-col items-center gap-0.5">
                        {hasResults ? (
                          <>
                            <span className={`text-[11px] font-bold ${delta > 0 ? 'text-green-500' : delta < 0 ? 'text-red-400' : 'text-gray-300'}`}>
                              {delta > 0 ? `▲${delta}` : delta < 0 ? `▼${Math.abs(delta)}` : '—0'}
                            </span>
                            <Sparkline values={sparkVals} color={isCurrent ? '#003087' : '#9ca3af'} />
                          </>
                        ) : <span className="text-gray-200 text-[11px]">—</span>}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Barème */}
              <div className="border border-dashed border-[#e1e4e8] px-4 py-3 rounded-lg">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Barème</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
                  {[['Groupe','2 pts'],['16e','2 pts'],['1/8','5 pts'],['Quart','10 pts'],['Demi','15 pts'],['Finale','25 pts'],['3e place','10 pts']].map(([l,v]) => (
                    <span key={l}>{l} <strong className="text-[#003087]">{v}</strong></span>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Sidebar ──────────────────────────────────────────────────── */}
            <div className="lg:w-64 shrink-0 space-y-4">

              {/* Champions choisis */}
              <div className="bg-white border border-[#e1e4e8] shadow-sm rounded-xl overflow-hidden">
                <div className="bg-[#003087] px-4 py-3">
                  <p className="font-condensed text-[13px] font-700 uppercase tracking-widest text-white">Champions choisis</p>
                </div>
                <div className="divide-y divide-[#f0f2f5]">
                  {championsMap.length === 0 ? (
                    <p className="px-4 py-3 text-[12px] text-gray-400 italic">Aucun bracket soumis</p>
                  ) : championsMap.map(([name, { flag, count }]) => (
                    <div key={name} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-[13px] text-[#111827] flex items-center gap-2">{flag} {name}</span>
                      <span className="font-condensed text-[15px] font-700 text-[#003087]">{count}</span>
                    </div>
                  ))}
                  {/* No bracket players */}
                  {entries.filter(e => !e.bracketData).length > 0 && (
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-[13px] text-gray-400">— Aucun</span>
                      <span className="font-condensed text-[15px] font-700 text-gray-300">{entries.filter(e => !e.bracketData).length}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Meilleur joueur */}
              {bestPlayer && hasResults && (
                <div className="bg-white border border-[#e1e4e8] shadow-sm rounded-xl overflow-hidden">
                  <div className="bg-[#003087] px-4 py-3 flex items-center gap-2">
                    <p className="font-condensed text-[13px] font-700 uppercase tracking-widest text-white">Meilleur joueur</p>
                    <span className="text-base">🔥</span>
                  </div>
                  <div className="px-4 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#003087] text-white flex items-center justify-center font-black text-[15px] uppercase shrink-0">
                      {bestPlayer.pseudo[0]}
                    </div>
                    <div>
                      <p className="font-condensed text-[16px] font-700 text-[#003087]">{bestPlayer.pseudo}</p>
                      <p className="text-[11px] text-gray-400">{bestPlayer.breakdown.total} pts au total</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Écart avec le 2e */}
              {hasResults && leader && second && (
                <div className="bg-white border border-[#e1e4e8] shadow-sm rounded-xl overflow-hidden">
                  <div className="bg-[#003087] px-4 py-3">
                    <p className="font-condensed text-[13px] font-700 uppercase tracking-widest text-white">
                      {amILeader ? 'Mon avance' : 'Écart avec le 1er'}
                    </p>
                  </div>
                  <div className="px-4 py-4">
                    <p className={`font-condensed text-[32px] font-800 leading-none ${gap === 0 ? 'text-gray-400' : 'text-green-500'}`}>
                      {gap === 0 ? '=' : `+${gap} pts`}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {amILeader ? `Avance sur ${second.pseudo}` : `Retard sur ${leader.pseudo}`}
                    </p>
                    <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#003087] rounded-full" style={{ width: `${Math.round((second.breakdown.total / (leader.breakdown.total || 1)) * 100)}%` }} />
                    </div>
                    <div className="flex justify-between mt-1 text-[9px] text-gray-400">
                      <span>{second.pseudo} · {second.breakdown.total}</span>
                      <span>{leader.pseudo} · {leader.breakdown.total}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Ma position */}
              {myEntry && myRank > 0 && hasResults && (
                <div className="bg-white border border-[#e1e4e8] shadow-sm rounded-xl overflow-hidden">
                  <div className="bg-[#c8102e] px-4 py-3">
                    <p className="font-condensed text-[13px] font-700 uppercase tracking-widest text-white">Ma position</p>
                  </div>
                  <div className="px-4 py-4 flex items-center gap-4">
                    <div className="text-center">
                      <p className="font-condensed text-[40px] font-800 text-[#003087] leading-none">#{myRank}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">rang</p>
                    </div>
                    <div className="w-px h-12 bg-[#e1e4e8]" />
                    <div className="text-center">
                      <p className="font-condensed text-[40px] font-800 text-[#c8102e] leading-none">{myEntry.breakdown.total}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">points</p>
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
