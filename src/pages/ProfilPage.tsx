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
  const exactScores = predictions.filter(p => p.points_earned !== null && p.points_earned > 0 && matches.find(m => m.id === p.match_id && p.pred_home === m.score_home && p.pred_away === m.score_away)).length
  const correctResults = predictions.filter(p => (p.points_earned ?? 0) > 0).length

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-[#f5c518]/20 border-2 border-[#f5c518] flex items-center justify-center text-2xl font-bold text-[#f5c518] uppercase">
          {player?.pseudo?.[0]}
        </div>
        <div>
          <h1 className="font-heading text-3xl text-white tracking-wide">{player?.pseudo}</h1>
          <p className="text-slate-500 text-sm">Mes statistiques</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Total points', value: totalPoints, color: 'text-[#f5c518]' },
          { label: 'Scores exacts', value: exactScores, color: 'text-purple-400' },
          { label: 'Bons résultats', value: correctResults, color: 'text-green-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#111e35] border border-[#1e3a5f] rounded-xl p-4 text-center">
            <div className={`font-heading text-3xl ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Predictions list */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-2 border-[#f5c518] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="font-heading text-xl text-slate-400 tracking-wider mb-4">MES PRONOSTICS</h2>
          {matches.filter(m => predMap[m.id]).map(match => {
            const pred = predMap[match.id]
            const hasResult = match.score_home !== null
            const pts = PHASE_POINTS[match.phase as keyof typeof PHASE_POINTS]

            let badge: string | null = null
            let badgeStyle = ''
            if (hasResult && pred) {
              if (pred.pred_home === match.score_home && pred.pred_away === match.score_away) {
                badge = `⭐ +${pts.result + pts.exact} pts`
                badgeStyle = 'text-[#f5c518] bg-[#f5c518]/10'
              } else if ((pred.points_earned ?? 0) > 0) {
                badge = `✓ +${pts.result} pts`
                badgeStyle = 'text-green-400 bg-green-400/10'
              } else if (pred.points_earned === 0) {
                badge = '✗ 0 pts'
                badgeStyle = 'text-red-400 bg-red-400/10'
              }
            }

            return (
              <div
                key={match.id}
                className="bg-[#111e35] border border-[#1e3a5f] rounded-xl px-4 py-3 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-500 mb-0.5">
                    {PHASE_LABELS[match.phase as keyof typeof PHASE_LABELS]} ·{' '}
                    {format(new Date(match.kickoff_at), 'd MMM', { locale: fr })}
                  </div>
                  <div className="text-sm text-white font-medium truncate">
                    {match.flag_home} {match.team_home} vs {match.team_away} {match.flag_away}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-heading text-lg text-slate-300">
                    {pred.pred_home} — {pred.pred_away}
                  </span>
                  {hasResult && (
                    <span className="text-xs text-slate-500">
                      ({match.score_home}–{match.score_away})
                    </span>
                  )}
                  {badge && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeStyle}`}>
                      {badge}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
          {matches.filter(m => predMap[m.id]).length === 0 && (
            <div className="text-center py-16 text-slate-500">
              <div className="text-4xl mb-3">🎯</div>
              <p>Tu n'as encore aucun pronostic.</p>
              <p className="text-sm mt-1">Va sur l'onglet Matchs pour commencer !</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
