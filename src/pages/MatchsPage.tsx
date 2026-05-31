import { useState, useEffect, useCallback } from 'react'
import { isPast } from 'date-fns'
import toast from 'react-hot-toast'
import { ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import MatchCard from '../components/ui/MatchCard'
import type { Match, Prediction, Phase } from '../types'
import { PHASE_LABELS } from '../types'

const PHASES: Phase[] = ['groupes', 'huitiemes', 'quarts', 'demis', 'finale']

export default function MatchsPage() {
  const { player } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({})
  const [openPhases, setOpenPhases] = useState<Set<Phase>>(new Set())
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!player) return
    setLoading(true)
    const [{ data: matchData }, { data: predData }] = await Promise.all([
      supabase.from('matches').select('*').order('kickoff_at'),
      supabase.from('predictions').select('*').eq('player_id', player.id),
    ])
    if (matchData) setMatches(matchData as Match[])
    if (predData) {
      const map: Record<string, Prediction> = {}
      for (const p of predData as Prediction[]) map[p.match_id] = p
      setPredictions(map)
    }
    setLoading(false)
  }, [player])

  useEffect(() => { fetchData() }, [fetchData])

  // Default: open phases with upcoming matches
  useEffect(() => {
    if (matches.length > 0 && openPhases.size === 0) {
      const withOpen = PHASES.filter(p =>
        matches.some(m => m.phase === p && !m.is_locked && !isPast(new Date(m.kickoff_at)))
      )
      const toOpen = withOpen.length > 0
        ? withOpen
        : [matches[0]?.phase as Phase].filter(Boolean)
      setOpenPhases(new Set(toOpen))
    }
  }, [matches])

  async function handlePredict(matchId: string, home: number, away: number): Promise<boolean> {
    if (!player) return false
    const existing = predictions[matchId]
    const { error } = existing
      ? await supabase.from('predictions').update({ pred_home: home, pred_away: away }).eq('id', existing.id)
      : await supabase.from('predictions').insert({ player_id: player.id, match_id: matchId, pred_home: home, pred_away: away })

    if (error) {
      toast.error('Erreur de sauvegarde')
      return false
    }
    setPredictions(prev => ({
      ...prev,
      [matchId]: existing
        ? { ...existing, pred_home: home, pred_away: away }
        : { id: crypto.randomUUID(), player_id: player.id, match_id: matchId, pred_home: home, pred_away: away, points_earned: null, created_at: new Date().toISOString() },
    }))
    return true
  }

  function togglePhase(phase: Phase) {
    setOpenPhases(prev => {
      const next = new Set(prev)
      if (next.has(phase)) next.delete(phase)
      else next.add(phase)
      return next
    })
  }

  const phaseGroups = PHASES
    .filter(p => matches.some(m => m.phase === p))
    .map(p => ({
      phase: p,
      matches: matches.filter(m => m.phase === p),
      openCount: matches.filter(m => m.phase === p && !m.is_locked && !isPast(new Date(m.kickoff_at))).length,
    }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (phaseGroups.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-400 dark:text-slate-500">
        <div className="text-5xl mb-4">📅</div>
        <p className="font-medium text-gray-600 dark:text-slate-400">Aucun match pour l'instant.</p>
        <p className="text-sm mt-1">L'admin les ajoutera bientôt !</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 space-y-3">
      {phaseGroups.map(({ phase, matches: phaseMatches, openCount }) => {
        const isOpen = openPhases.has(phase)
        return (
          <div
            key={phase}
            className="rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800"
          >
            {/* Accordion header */}
            <button
              onClick={() => togglePhase(phase)}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="font-semibold text-gray-900 dark:text-slate-100 text-sm">
                  {PHASE_LABELS[phase]}
                </span>
                {openCount > 0 && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                    {openCount} ouvert{openCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-gray-400 dark:text-slate-500 text-xs">
                <span>{phaseMatches.length} match{phaseMatches.length > 1 ? 's' : ''}</span>
                <ChevronDown
                  size={15}
                  className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              </div>
            </button>

            {/* Match cards */}
            {isOpen && (
              <div className="border-t border-gray-100 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700/60">
                {phaseMatches.map(match => (
                  <div key={match.id} className="p-3">
                    <MatchCard
                      match={match}
                      prediction={predictions[match.id]}
                      onPredict={handlePredict}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
