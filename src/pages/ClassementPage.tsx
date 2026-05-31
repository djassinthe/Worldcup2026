import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Player } from '../types'
import { type BracketData, DEFAULT_DATA, getChampion } from '../utils/bracketData'
import { calculateScore, type ScoreBreakdown } from '../utils/scoreUtils'

interface RankEntry {
  player_id: string
  pseudo: string
  breakdown: ScoreBreakdown
  champion: { name: string; flag: string } | null
}

const MEDAL = ['🥇', '🥈', '🥉']
const MEDAL_BG = ['bg-amber-50 border-amber-200', 'bg-gray-50 border-gray-200', 'bg-orange-50 border-orange-200']

export default function ClassementPage() {
  const { player } = useAuth()
  const [entries, setEntries] = useState<RankEntry[]>([])
  const [hasResults, setHasResults] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [resultsRes, predsRes, playersRes] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('tournament_results').select('data').limit(1).maybeSingle(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('bracket_predictions').select('player_id, data'),
        supabase.from('players').select('id, pseudo'),
      ])
      const realData: BracketData = { ...DEFAULT_DATA, ...(resultsRes.data?.data ?? {}) }
      const preds: { player_id: string; data: BracketData }[] = predsRes.data ?? []
      const players: Pick<Player, 'id' | 'pseudo'>[] = playersRes.data ?? []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyResults = realData.r16.some((x: any) => x !== null) ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.values(realData.groupQualified).some((q: any) => q[0] !== 0 || q[1] !== 1)
      setHasResults(anyResults)
      const playerMap = new Map(players.map(p => [p.id, p.pseudo]))
      const ranked = preds
        .map(pred => ({
          player_id: pred.player_id,
          pseudo: playerMap.get(pred.player_id) ?? '?',
          breakdown: calculateScore(pred.data, realData),
          champion: getChampion(pred.data),
        }))
        .sort((a, b) => b.breakdown.total - a.breakdown.total)
      setEntries(ranked)
      setLoading(false)
    }
    load()
  }, [])

  const myRank = entries.findIndex(e => e.player_id === player?.id) + 1
  const myEntry = entries.find(e => e.player_id === player?.id)

  return (
    <div className="max-w-3xl mx-auto">

      {/* Hero band */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 md:px-6 py-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-[32px] font-800 text-[#003087] tracking-tight leading-none">
              Classement
            </h1>
            <p className="text-[13px] text-gray-400 mt-2 font-medium">
              {hasResults ? 'Calculé sur les résultats officiels' : 'En attente des résultats'}
            </p>
          </div>
          {/* My rank chip */}
          {myRank > 0 && hasResults && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Ma position</p>
                <p className="font-condensed text-[32px] font-700 text-[#003087] leading-none">#{myRank}</p>
              </div>
              {myEntry && (
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Mes points</p>
                  <p className="font-condensed text-[32px] font-700 text-[#c8102e] leading-none">{myEntry.breakdown.total}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 md:px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-5 h-5 border-2 border-[#003087] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !hasResults ? (
          <div className="bg-white border border-gray-200 shadow-sm px-6 py-16 text-center">
            <div className="text-5xl mb-4">⏳</div>
            <p className="font-condensed text-[22px] font-700 uppercase text-[#003087] tracking-wide">En attente des résultats</p>
            <p className="text-[13px] text-gray-500 mt-2 max-w-xs mx-auto">
              Le classement sera calculé une fois les résultats officiels saisis par l'administrateur.
            </p>
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-white border border-gray-200 px-6 py-16 text-center">
            <p className="text-[13px] text-gray-500">Aucun bracket soumis pour l'instant.</p>
          </div>
        ) : (
          <div className="space-y-3">

            {/* Top 3 podium cards */}
            {entries.length >= 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {entries.slice(0, Math.min(3, entries.length)).map((entry, i) => {
                  const isCurrent = entry.player_id === player?.id
                  return (
                    <div key={entry.player_id}
                      className={`border-2 ${isCurrent ? 'border-[#003087]' : MEDAL_BG[i].split(' ')[1]} bg-white shadow-sm p-4 relative`}
                    >
                      <div className="absolute top-3 right-3 text-2xl">{MEDAL[i]}</div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">#{i + 1}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`w-8 h-8 flex items-center justify-center text-[12px] font-black uppercase ${isCurrent ? 'bg-[#003087] text-white' : 'bg-gray-100 text-gray-600'}`}>
                          {entry.pseudo[0]}
                        </span>
                        <span className={`font-condensed text-[18px] font-700 uppercase tracking-wide ${isCurrent ? 'text-[#003087]' : 'text-[#111827]'}`}>
                          {entry.pseudo}
                        </span>
                      </div>
                      <p className="font-condensed text-[36px] font-800 text-[#c8102e] leading-none">{entry.breakdown.total}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">pts</p>
                      {entry.champion && (
                        <p className="text-[11px] text-gray-500 mt-2 truncate">{entry.champion.flag} {entry.champion.name}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Rest of the table */}
            {entries.length > 3 && (
              <div className="bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center px-4 py-2 bg-gray-50 border-b border-gray-200 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  <span className="w-8">#</span>
                  <span className="flex-1">Joueur</span>
                  <span className="hidden sm:block text-[10px] text-gray-300 font-medium normal-case tracking-normal mr-4">G · 1/8 · Q · D · F</span>
                  <span className="w-16 text-right">Points</span>
                  <span className="hidden sm:block w-32 text-right">Champion</span>
                </div>
                {entries.slice(3).map((entry, i) => {
                  const rank = i + 4
                  const isCurrent = entry.player_id === player?.id
                  return (
                    <div key={entry.player_id}
                      className={`flex items-center px-4 py-3 border-b border-gray-100 last:border-0 transition-colors
                        ${isCurrent ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      <span className="w-8 text-[14px] font-bold text-gray-400">{rank}</span>
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <span className={`w-7 h-7 flex items-center justify-center text-[11px] font-black uppercase shrink-0 ${isCurrent ? 'bg-[#003087] text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {entry.pseudo[0]}
                        </span>
                        <div className="min-w-0">
                          <p className={`text-[13px] font-semibold truncate ${isCurrent ? 'text-[#003087]' : 'text-[#111827]'}`}>
                            {entry.pseudo}{isCurrent && <span className="ml-1 text-[11px] font-normal text-gray-400">(moi)</span>}
                          </p>
                          <p className="text-[11px] text-gray-400 hidden sm:block">
                            {entry.breakdown.groups} · {entry.breakdown.r16} · {entry.breakdown.quarters} · {entry.breakdown.semis} · {entry.breakdown.final}
                          </p>
                        </div>
                      </div>
                      <span className={`w-16 text-right text-[15px] font-bold ${isCurrent ? 'text-[#c8102e]' : 'text-[#111827]'}`}>
                        {entry.breakdown.total}
                      </span>
                      <span className="hidden sm:block w-32 text-right text-[11px] text-gray-400 truncate pl-2">
                        {entry.champion ? `${entry.champion.flag} ${entry.champion.name}` : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Barème */}
            <div className="mt-4 border border-dashed border-gray-200 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Barème</p>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-gray-500">
                <span>Groupe : <strong>2 pts</strong>/équipe</span>
                <span>1/8 : <strong>5 pts</strong></span>
                <span>Quart : <strong>10 pts</strong></span>
                <span>Demi : <strong>15 pts</strong></span>
                <span>Finale : <strong>25 pts</strong></span>
                <span>3e place : <strong>10 pts</strong></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
