import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Match, Prediction } from '../types'
import { PHASE_LABELS, PHASE_POINTS } from '../types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function ProfilPage() {
  const { player } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      if (!player) return
      const [{ data: m }, { data: p }] = await Promise.all([
        supabase.from('matches').select('*').order('kickoff_at'),
        supabase.from('predictions').select('*').eq('player_id', player.id),
      ])
      setMatches((m ?? []) as Match[])
      setPredictions((p ?? []) as Prediction[])
      setLoading(false)
    }
    fetch()
  }, [player])

  const predMap = Object.fromEntries(predictions.map(p => [p.match_id, p]))
  const totalPoints = predictions.reduce((sum, p) => sum + (p.points_earned ?? 0), 0)
  const exactScores = predictions.filter(p =>
    p.points_earned !== null && p.points_earned > 0 &&
    matches.find(m => m.id === p.match_id && p.pred_home === m.score_home && p.pred_away === m.score_away)
  ).length
  const correctResults = predictions.filter(p => (p.points_earned ?? 0) > 0).length

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-lg font-bold text-blue-600 dark:text-blue-400 uppercase">
          {player?.pseudo?.[0]}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">{player?.pseudo}</h1>
          <p className="text-sm text-gray-400 dark:text-slate-500">Mes statistiques</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Points', value: totalPoints, accent: 'text-blue-600 dark:text-blue-400' },
          { label: 'Scores exacts', value: exactScores, accent: 'text-amber-500' },
          { label: 'Bons résultats', value: correctResults, accent: 'text-green-500' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-center">
            <div className={`text-3xl font-bold ${stat.accent}`}>{stat.value}</div>
            <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Predictions list */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Mes pronostics</h2>
          {matches.filter(m => predMap[m.id]).length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-slate-500">
              <div className="text-4xl mb-3">🎯</div>
              <p>Tu n'as encore aucun pronostic.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden divide-y divide-gray-50 dark:divide-slate-700/60">
              {matches.filter(m => predMap[m.id]).map(match => {
                const pred = predMap[match.id]
                const hasResult = match.score_home !== null
                const pts = PHASE_POINTS[match.phase as keyof typeof PHASE_POINTS]

                let badge: string | null = null
                let badgeCls = ''
                if (hasResult && pred) {
                  if (pred.pred_home === match.score_home && pred.pred_away === match.score_away) {
                    badge = `+${pts.result + pts.exact} pts`
                    badgeCls = 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                  } else if ((pred.points_earned ?? 0) > 0) {
                    badge = `+${pts.result} pts`
                    badgeCls = 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  } else if (pred.points_earned === 0) {
                    badge = '0 pts'
                    badgeCls = 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500'
                  }
                }

                return (
                  <div key={match.id} className="px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">
                        {PHASE_LABELS[match.phase as keyof typeof PHASE_LABELS]} · {format(new Date(match.kickoff_at), 'd MMM', { locale: fr })}
                      </div>
                      <div className="text-sm text-gray-900 dark:text-slate-100 font-medium truncate">
                        {match.flag_home} {match.team_home} – {match.team_away} {match.flag_away}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold text-gray-700 dark:text-slate-300 text-sm">
                        {pred.pred_home} – {pred.pred_away}
                      </span>
                      {hasResult && (
                        <span className="text-xs text-gray-400 dark:text-slate-500">
                          ({match.score_home}–{match.score_away})
                        </span>
                      )}
                      {badge && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeCls}`}>{badge}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
