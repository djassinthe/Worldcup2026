import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
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
  const [activePhase, setActivePhase] = useState<Phase>('groupes')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

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

  // Auto-select first phase with upcoming matches
  useEffect(() => {
    if (matches.length > 0) {
      const upcoming = matches.find(m => !m.is_locked)
      if (upcoming) setActivePhase(upcoming.phase as Phase)
    }
  }, [matches])

  async function handlePredict(matchId: string, home: number, away: number) {
    if (!player) return
    setSaving(matchId)

    const existing = predictions[matchId]
    const payload = {
      player_id: player.id,
      match_id: matchId,
      pred_home: home,
      pred_away: away,
    }

    const { error } = existing
      ? await supabase.from('predictions').update({ pred_home: home, pred_away: away }).eq('id', existing.id)
      : await supabase.from('predictions').insert(payload)

    setSaving(null)
    if (error) {
      toast.error('Erreur lors de la sauvegarde')
    } else {
      toast.success(existing ? 'Pronostic modifié !' : 'Pronostic enregistré !')
      fetchData()
    }
  }

  const phaseMatches = matches.filter(m => m.phase === activePhase)
  const availablePhases = PHASES.filter(p => matches.some(m => m.phase === p))

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Phase tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {availablePhases.map(phase => (
          <button
            key={phase}
            onClick={() => setActivePhase(phase)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activePhase === phase
                ? 'bg-[#f5c518] text-[#060d1a] font-bold'
                : 'bg-[#111e35] text-slate-400 border border-[#1e3a5f] hover:border-blue-500/50'
            }`}
          >
            {PHASE_LABELS[phase]}
          </button>
        ))}
      </div>

      {/* Match cards */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-[#f5c518] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : phaseMatches.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <div className="text-5xl mb-3">📅</div>
          <p>Aucun match pour cette phase pour l'instant.</p>
          <p className="text-sm mt-1">L'admin les ajoutera bientôt !</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activePhase}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid gap-4"
          >
            {phaseMatches.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                prediction={predictions[match.id]}
                onPredict={handlePredict}
                loading={saving === match.id}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
