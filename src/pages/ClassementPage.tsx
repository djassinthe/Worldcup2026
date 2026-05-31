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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="px-4 md:px-6 pt-6 pb-4">
        <h1 className="text-[22px] font-normal text-gray-900 dark:text-[#e8eaed] leading-tight">Classement</h1>
        <p className="text-[13px] text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">
          {hasResults ? 'Calculé sur les résultats officiels' : 'Mis à jour après chaque phase'}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-5 h-5 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !hasResults ? (
        <div className="px-4 md:px-6 py-16 text-center">
          <p className="text-[15px] text-gray-900 dark:text-[#e8eaed] font-medium">En attente des résultats</p>
          <p className="text-[13px] text-[#5f6368] dark:text-[#9aa0a6] mt-2">
            Le classement sera calculé une fois les résultats officiels saisis par l'administrateur.
          </p>
        </div>
      ) : entries.length === 0 ? (
        <div className="px-4 md:px-6 py-16 text-center">
          <p className="text-[13px] text-[#5f6368] dark:text-[#9aa0a6]">Aucun bracket soumis pour l'instant.</p>
        </div>
      ) : (
        <div className="px-4 md:px-6 pb-8">
          {myRank > 0 && (
            <div className="mb-4 px-4 py-3 border-l-[3px] border-[#1a73e8] dark:border-[#8ab4f8] bg-[#e8f0fe] dark:bg-[#1e3a5f]/30 flex items-center justify-between">
              <span className="text-[13px] text-[#1a73e8] dark:text-[#8ab4f8] font-medium">Ma position</span>
              <span className="text-[15px] font-bold text-[#1a73e8] dark:text-[#8ab4f8]">#{myRank}</span>
            </div>
          )}
          <div className="border border-gray-200 dark:border-[#3c4043] divide-y divide-gray-200 dark:divide-[#3c4043]">
            <div className="flex items-center px-4 py-2 bg-gray-50 dark:bg-[#292a2d] text-[11px] font-semibold uppercase tracking-widest text-[#5f6368] dark:text-[#9aa0a6]">
              <span className="w-8">#</span>
              <span className="flex-1">Joueur</span>
              <span className="w-16 text-right">Points</span>
              <span className="hidden sm:block w-32 text-right">Champion prédit</span>
            </div>
            {entries.map((entry, i) => {
              const isCurrent = entry.player_id === player?.id
              const medalColor = i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-[#5f6368] dark:text-[#9aa0a6]'
              return (
                <div key={entry.player_id} className={`flex items-center px-4 py-3 transition-colors ${isCurrent ? 'bg-[#e8f0fe] dark:bg-[#1e3a5f]/20' : 'hover:bg-gray-50 dark:hover:bg-[#292a2d]'}`}>
                  <span className={`w-8 text-[14px] font-bold ${medalColor}`}>{i + 1}</span>
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <span className={`w-7 h-7 flex items-center justify-center text-[11px] font-bold uppercase shrink-0 ${isCurrent ? 'bg-[#1a73e8] dark:bg-[#8ab4f8] text-white dark:text-[#202124]' : 'bg-gray-100 dark:bg-[#292a2d] text-[#5f6368] dark:text-[#9aa0a6]'}`}>
                      {entry.pseudo[0]}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-[13px] font-medium truncate ${isCurrent ? 'text-[#1a73e8] dark:text-[#8ab4f8]' : 'text-gray-900 dark:text-[#e8eaed]'}`}>
                        {entry.pseudo}{isCurrent && <span className="ml-1 text-[11px] font-normal text-[#5f6368] dark:text-[#9aa0a6]">(moi)</span>}
                      </p>
                      <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">
                        G:{entry.breakdown.groups} · 1/8:{entry.breakdown.r16} · Q:{entry.breakdown.quarters} · D:{entry.breakdown.semis} · F:{entry.breakdown.final}
                      </p>
                    </div>
                  </div>
                  <span className={`w-16 text-right text-[15px] font-bold ${isCurrent ? 'text-[#1a73e8] dark:text-[#8ab4f8]' : 'text-gray-900 dark:text-[#e8eaed]'}`}>
                    {entry.breakdown.total}
                  </span>
                  <span className="hidden sm:block w-32 text-right text-[12px] text-[#5f6368] dark:text-[#9aa0a6] truncate pl-2">
                    {entry.champion ? `${entry.champion.flag} ${entry.champion.name}` : '—'}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="mt-4 px-3 py-3 border border-dashed border-gray-200 dark:border-[#3c4043]">
            <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] font-medium mb-1.5">Barème des points</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">
              <span>Groupe : 2 pts/équipe</span><span>1/8 : 5 pts</span><span>Quart : 10 pts</span><span>Demi : 15 pts</span><span>Finale : 25 pts</span><span>3e place : 10 pts</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
