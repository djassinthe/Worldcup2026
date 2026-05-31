import { useState } from 'react'
import React from 'react'
import { motion } from 'framer-motion'
import { formatDistanceToNow, isPast } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Lock, Clock } from 'lucide-react'
import type { Match, Prediction } from '../../types'
import { PHASE_POINTS } from '../../types'

interface MatchCardProps {
  match: Match
  prediction?: Prediction
  onPredict: (matchId: string, home: number, away: number) => Promise<void>
  loading?: boolean
}

export default function MatchCard({ match, prediction, onPredict, loading }: MatchCardProps) {
  const kickoff = new Date(match.kickoff_at)
  const locked = match.is_locked || isPast(kickoff)
  const hasResult = match.score_home !== null && match.score_away !== null
  const pts = PHASE_POINTS[match.phase as keyof typeof PHASE_POINTS]

  let resultBadge: 'exact' | 'correct' | 'wrong' | null = null
  if (prediction && hasResult) {
    const actualDiff = (match.score_home ?? 0) - (match.score_away ?? 0)
    const predDiff = prediction.pred_home - prediction.pred_away
    if (prediction.pred_home === match.score_home && prediction.pred_away === match.score_away) {
      resultBadge = 'exact'
    } else if (Math.sign(actualDiff) === Math.sign(predDiff)) {
      resultBadge = 'correct'
    } else {
      resultBadge = 'wrong'
    }
  }

  const badgeStyle = {
    exact: 'bg-[#f5c518]/20 text-[#f5c518] border-[#f5c518]/40',
    correct: 'bg-green-500/20 text-green-400 border-green-500/40',
    wrong: 'bg-red-500/20 text-red-400 border-red-500/40',
  }

  const badgeLabel = {
    exact: `⭐ Score exact! +${pts.result + pts.exact} pts`,
    correct: `✓ Bon résultat +${pts.result} pts`,
    wrong: '✗ Raté',
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111e35] border border-[#1e3a5f] rounded-2xl p-5 hover:border-[#2d5a8e] transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 text-xs text-slate-500">
        <span>{match.venue}</span>
        {locked ? (
          <span className="flex items-center gap-1 text-slate-600">
            <Lock size={11} /> Fermé
          </span>
        ) : (
          <span className="flex items-center gap-1 text-blue-400">
            <Clock size={11} />
            Ferme {formatDistanceToNow(kickoff, { addSuffix: true, locale: fr })}
          </span>
        )}
      </div>

      {/* Teams */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center mb-5">
        <div className="flex flex-col items-center gap-2">
          <span className="text-4xl">{match.flag_home}</span>
          <span className="font-heading text-lg tracking-wide text-center text-white">{match.team_home}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          {hasResult ? (
            <div className="flex items-center gap-2">
              <span className="font-heading text-3xl text-[#f5c518]">{match.score_home}</span>
              <span className="text-slate-500 font-bold">-</span>
              <span className="font-heading text-3xl text-[#f5c518]">{match.score_away}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-heading text-2xl text-slate-600">-</span>
              <span className="text-slate-600 font-bold">vs</span>
              <span className="font-heading text-2xl text-slate-600">-</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-4xl">{match.flag_away}</span>
          <span className="font-heading text-lg tracking-wide text-center text-white">{match.team_away}</span>
        </div>
      </div>

      {/* Result badge */}
      {resultBadge && (
        <div className={`text-center text-xs font-semibold px-3 py-1.5 rounded-full border mb-4 ${badgeStyle[resultBadge]}`}>
          {badgeLabel[resultBadge]}
        </div>
      )}

      {/* Prediction area */}
      {locked ? (
        prediction ? (
          <div className="flex items-center justify-center gap-4 bg-[#0a1628] rounded-xl p-3">
            <span className="text-slate-400 text-sm">Mon pronostic :</span>
            <span className="font-heading text-lg text-white">
              {prediction.pred_home} — {prediction.pred_away}
            </span>
          </div>
        ) : (
          <p className="text-center text-slate-600 text-xs">Aucun pronostic soumis</p>
        )
      ) : (
        <PredictForm
          matchId={match.id}
          existing={prediction}
          onSubmit={onPredict}
          loading={loading}
          pts={pts}
        />
      )}
    </motion.div>
  )
}

function PredictForm({
  matchId,
  existing,
  onSubmit,
  loading,
  pts,
}: {
  matchId: string
  existing?: Prediction
  onSubmit: (id: string, h: number, a: number) => Promise<void>
  loading?: boolean
  pts: { result: number; exact: number }
}) {
  const [home, setHome] = useState(existing?.pred_home ?? 0)
  const [away, setAway] = useState(existing?.pred_away ?? 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit(matchId, home, away)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center gap-3 justify-center mb-3">
        <ScoreInput value={home} onChange={setHome} />
        <span className="text-slate-500 font-bold text-lg">—</span>
        <ScoreInput value={away} onChange={setAway} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {pts.result} pts résultat · +{pts.exact} pts score exact
        </span>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-1.5 bg-[#f5c518] text-[#060d1a] text-sm font-bold rounded-lg hover:bg-[#fde68a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {existing ? 'Modifier' : 'Parier'}
        </button>
      </div>
    </form>
  )
}

function ScoreInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-8 h-8 rounded-lg bg-[#0a1628] text-white hover:bg-[#1e3a5f] transition-colors font-bold"
      >
        −
      </button>
      <span className="w-10 text-center font-heading text-2xl text-white">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(99, value + 1))}
        className="w-8 h-8 rounded-lg bg-[#0a1628] text-white hover:bg-[#1e3a5f] transition-colors font-bold"
      >
        +
      </button>
    </div>
  )
}
