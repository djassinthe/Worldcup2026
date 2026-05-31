import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Podium from '../components/ui/Podium'
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
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="font-heading text-4xl text-[#f5c518] tracking-wider mb-2 text-center">
        CLASSEMENT
      </h1>
      <p className="text-center text-slate-500 text-sm mb-8">
        Mis à jour après chaque résultat
      </p>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-[#f5c518] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <div className="text-5xl mb-3">🏆</div>
          <p>Le classement apparaîtra après les premiers résultats.</p>
        </div>
      ) : (
        <>
          {/* Podium top 3 */}
          {entries.length >= 2 && <Podium entries={entries} currentPlayerId={player?.id} />}

          {/* My rank banner */}
          {myRank > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="my-6 p-4 bg-[#f5c518]/10 border border-[#f5c518]/30 rounded-2xl flex items-center justify-between"
            >
              <span className="text-[#f5c518] font-medium">Ma position</span>
              <span className="font-heading text-2xl text-[#f5c518]">#{myRank}</span>
            </motion.div>
          )}

          {/* Full table */}
          <div className="bg-[#111e35] border border-[#1e3a5f] rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e3a5f] text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Joueur</th>
                  <th className="px-4 py-3 text-center">Pts</th>
                  <th className="px-4 py-3 text-center hidden sm:table-cell">Scores exacts</th>
                  <th className="px-4 py-3 text-center hidden sm:table-cell">Bons résultats</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => {
                  const isCurrent = entry.player_id === player?.id
                  return (
                    <motion.tr
                      key={entry.player_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`border-b border-[#1e3a5f]/50 last:border-0 transition-colors ${
                        isCurrent ? 'bg-[#f5c518]/5' : 'hover:bg-white/2'
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <span className={`font-heading text-lg ${i === 0 ? 'text-[#f5c518]' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-700' : 'text-slate-600'}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold uppercase ${isCurrent ? 'bg-[#f5c518]/20 text-[#f5c518]' : 'bg-[#1e3a5f] text-slate-400'}`}>
                            {entry.pseudo[0]}
                          </span>
                          <span className={`font-medium text-sm ${isCurrent ? 'text-[#f5c518]' : 'text-white'}`}>
                            {entry.pseudo}
                            {isCurrent && <span className="ml-1 text-xs text-slate-500">(moi)</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-heading text-xl text-white">{entry.total_points}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center hidden sm:table-cell text-[#f5c518] font-medium">
                        ⭐ {entry.exact_scores}
                      </td>
                      <td className="px-4 py-3.5 text-center hidden sm:table-cell text-green-400 font-medium">
                        ✓ {entry.correct_results}
                      </td>
                    </motion.tr>
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
