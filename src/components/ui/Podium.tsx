import { motion } from 'framer-motion'
import type { LeaderboardEntry } from '../../types'

interface PodiumProps {
  entries: LeaderboardEntry[]
  currentPlayerId?: string
}

const PODIUM_COLORS = ['#f5c518', '#9ca3af', '#cd7f32']
const PODIUM_HEIGHT = ['h-32', 'h-24', 'h-20']
const PODIUM_LABELS = ['🥇', '🥈', '🥉']

export default function Podium({ entries, currentPlayerId }: PodiumProps) {
  const top3 = entries.slice(0, 3)
  // Reorder: 2nd, 1st, 3rd for visual podium
  const order = [top3[1], top3[0], top3[2]].filter(Boolean)
  const visualIndex = [1, 0, 2]

  return (
    <div className="flex items-end justify-center gap-2 pt-8 pb-4">
      {order.map((entry, i) => {
        const rank = visualIndex[i]
        const color = PODIUM_COLORS[rank]
        const isCurrent = entry.player_id === currentPlayerId

        return (
          <motion.div
            key={entry.player_id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            className="flex flex-col items-center gap-2"
          >
            {/* Avatar */}
            <div
              className="relative w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold border-2 uppercase"
              style={{
                background: `${color}20`,
                borderColor: color,
                color: color,
                boxShadow: isCurrent ? `0 0 20px ${color}60` : undefined,
              }}
            >
              {entry.pseudo[0]}
              {isCurrent && (
                <span className="absolute -top-1 -right-1 text-xs">👑</span>
              )}
            </div>

            {/* Name + points */}
            <div className="text-center">
              <div className="text-sm font-semibold text-white">{entry.pseudo}</div>
              <div className="font-heading text-lg" style={{ color }}>
                {entry.total_points} pts
              </div>
            </div>

            {/* Podium block */}
            <div
              className={`w-24 ${PODIUM_HEIGHT[rank]} rounded-t-xl flex items-center justify-center text-2xl font-bold`}
              style={{ background: `${color}15`, borderTop: `3px solid ${color}` }}
            >
              {PODIUM_LABELS[rank]}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
