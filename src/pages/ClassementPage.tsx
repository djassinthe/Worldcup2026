import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { LeaderboardEntry } from '../types'

export default function ClassementPage() {
  const { player } = useAuth()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLeaderboard() {
      const { data } = await supabase.rpc('get_leaderboard')
      if (data) setEntries(data as LeaderboardEntry[])
      setLoading(false)
    }
    fetchLeaderboard()
  }, [])

  const myRank = entries.findIndex(e => e.player_id === player?.id) + 1

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Classement</h1>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">Mis à jour après chaque résultat</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-slate-500">
          <div className="text-4xl mb-3">🏆</div>
          <p>Le classement apparaîtra après les premiers résultats.</p>
        </div>
      ) : (
        <>
          {/* My rank */}
          {myRank > 0 && (
            <div className="mb-4 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between">
              <span className="text-blue-700 dark:text-blue-400 font-medium text-sm">Ma position</span>
              <span className="font-bold text-blue-700 dark:text-blue-400">#{myRank}</span>
            </div>
          )}

          {/* Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700 text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left w-10">#</th>
                  <th className="px-4 py-3 text-left">Joueur</th>
                  <th className="px-4 py-3 text-center">Pts</th>
                  <th className="px-4 py-3 text-center hidden sm:table-cell">⭐ Exacts</th>
                  <th className="px-4 py-3 text-center hidden sm:table-cell">✓ Résultats</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => {
                  const isCurrent = entry.player_id === player?.id
                  const rankColor = i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-gray-400 dark:text-slate-500'
                  return (
                    <tr
                      key={entry.player_id}
                      className={`border-b border-gray-50 dark:border-slate-700/50 last:border-0 transition-colors ${isCurrent ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-750'}`}
                    >
                      <td className="px-4 py-3">
                        <span className={`font-bold text-sm ${rankColor}`}>{i + 1}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold uppercase ${isCurrent ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'}`}>
                            {entry.pseudo[0]}
                          </span>
                          <span className={`font-medium text-sm ${isCurrent ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-slate-100'}`}>
                            {entry.pseudo}{isCurrent && <span className="ml-1 text-xs text-gray-400 dark:text-slate-500">(moi)</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-gray-900 dark:text-slate-100">{entry.total_points}</span>
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell text-amber-500 font-medium text-sm">{entry.exact_scores}</td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell text-green-500 font-medium text-sm">{entry.correct_results}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
