import { useState, useRef, useEffect } from 'react'
import { isPast, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Lock, Check, Loader2 } from 'lucide-react'
import type { Match, Prediction } from '../../types'
import { PHASE_POINTS } from '../../types'

interface MatchCardProps {
  match: Match
  prediction?: Prediction
  onPredict: (matchId: string, home: number, away: number) => Promise<boolean>
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function MatchCard({ match, prediction, onPredict }: MatchCardProps) {
  const kickoff = new Date(match.kickoff_at)
  const locked = match.is_locked || isPast(kickoff)
  const hasResult = match.score_home !== null && match.score_away !== null
  const pts = PHASE_POINTS[match.phase as keyof typeof PHASE_POINTS]

  const [homeScore, setHomeScore] = useState(prediction?.pred_home ?? 0)
  const [awayScore, setAwayScore] = useState(prediction?.pred_away ?? 0)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initializedRef = useRef(!!prediction)

  // Sync from parent when prediction first loads
  useEffect(() => {
    if (prediction && !initializedRef.current) {
      setHomeScore(prediction.pred_home)
      setAwayScore(prediction.pred_away)
      initializedRef.current = true
    }
  }, [prediction])

  function scheduleAutoSave(home: number, away: number) {
    if (locked) return
    if (timerRef.current) clearTimeout(timerRef.current)
    setSaveStatus('idle')
    timerRef.current = setTimeout(async () => {
      setSaveStatus('saving')
      const ok = await onPredict(match.id, home, away)
      setSaveStatus(ok ? 'saved' : 'error')
      if (ok) setTimeout(() => setSaveStatus('idle'), 2000)
    }, 600)
  }

  function changeScore(side: 'home' | 'away', delta: number) {
    if (locked) return
    if (side === 'home') {
      const next = Math.max(0, homeScore + delta)
      setHomeScore(next)
      scheduleAutoSave(next, awayScore)
    } else {
      const next = Math.max(0, awayScore + delta)
      setAwayScore(next)
      scheduleAutoSave(homeScore, next)
    }
  }

  // Result type
  let resultType: 'exact' | 'correct' | 'wrong' | null = null
  if (prediction && hasResult) {
    const actualDiff = (match.score_home ?? 0) - (match.score_away ?? 0)
    const predDiff = prediction.pred_home - prediction.pred_away
    if (prediction.pred_home === match.score_home && prediction.pred_away === match.score_away) {
      resultType = 'exact'
    } else if (Math.sign(actualDiff) === Math.sign(predDiff)) {
      resultType = 'correct'
    } else {
      resultType = 'wrong'
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 mb-3">
        <span>{format(kickoff, 'd MMM · HH:mm', { locale: fr })} · {match.venue}</span>
        {locked ? (
          <span className="flex items-center gap-1 text-gray-400 dark:text-slate-500">
            <Lock size={10} /> Fermé
          </span>
        ) : (
          <span className="text-blue-500 dark:text-blue-400">Ouvert</span>
        )}
      </div>

      {/* Teams + score area */}
      <div className="flex items-center justify-between gap-3">
        {/* Home */}
        <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <span className="text-3xl">{match.flag_home}</span>
          <span className="text-sm font-medium text-gray-900 dark:text-slate-100 text-center leading-tight">{match.team_home}</span>
        </div>

        {/* Center: result or stepper */}
        <div className="flex flex-col items-center gap-2 px-1">
          {hasResult ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-slate-100">{match.score_home}</span>
              <span className="text-gray-300 dark:text-slate-600">—</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-slate-100">{match.score_away}</span>
            </div>
          ) : locked ? (
            <div className="flex items-center gap-2 text-gray-400 dark:text-slate-500 font-semibold text-lg">
              <span>?</span><span className="text-gray-300 dark:text-slate-600">—</span><span>?</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Stepper value={homeScore} onChange={d => changeScore('home', d)} />
              <span className="text-gray-300 dark:text-slate-600 font-medium">—</span>
              <Stepper value={awayScore} onChange={d => changeScore('away', d)} />
            </div>
          )}
        </div>

        {/* Away */}
        <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <span className="text-3xl">{match.flag_away}</span>
          <span className="text-sm font-medium text-gray-900 dark:text-slate-100 text-center leading-tight">{match.team_away}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between text-xs min-h-[18px]">
        <div className="text-gray-400 dark:text-slate-500">
          {!locked && !hasResult && (
            <span>{pts.result} pts · +{pts.exact} si score exact</span>
          )}
          {locked && prediction && !hasResult && (
            <span>Mon pronostic : {prediction.pred_home}–{prediction.pred_away}</span>
          )}
          {locked && !prediction && !hasResult && (
            <span className="text-gray-300 dark:text-slate-600">Pas de pronostic</span>
          )}
          {hasResult && resultType === 'exact' && (
            <span className="text-amber-500 font-semibold">⭐ Score exact · +{pts.result + pts.exact} pts</span>
          )}
          {hasResult && resultType === 'correct' && (
            <span className="text-green-500 dark:text-green-400 font-medium">✓ Bon résultat · +{pts.result} pts</span>
          )}
          {hasResult && resultType === 'wrong' && (
            <span className="text-red-400 font-medium">✗ Raté · 0 pts</span>
          )}
          {hasResult && !prediction && (
            <span className="text-gray-300 dark:text-slate-600">Pas de pronostic</span>
          )}
        </div>
        {!locked && (
          <div className="text-gray-400 dark:text-slate-500 flex items-center gap-1">
            {saveStatus === 'saving' && <><Loader2 size={11} className="animate-spin" /> Enregistrement…</>}
            {saveStatus === 'saved' && <><Check size={11} className="text-green-500" /> <span className="text-green-500">Sauvegardé</span></>}
            {saveStatus === 'error' && <span className="text-red-400">Erreur</span>}
          </div>
        )}
      </div>
    </div>
  )
}

function Stepper({ value, onChange }: { value: number; onChange: (delta: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(-1)}
        className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium text-base leading-none"
      >
        −
      </button>
      <span className="w-6 text-center font-semibold text-gray-900 dark:text-slate-100 text-lg tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(1)}
        className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium text-base leading-none"
      >
        +
      </button>
    </div>
  )
}
