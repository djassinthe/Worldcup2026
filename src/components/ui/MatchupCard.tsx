import type { Team } from '../../utils/bracketData'
import { TeamPill } from './TeamPill'

// ─── MatchupCard ────────────────────────────────────────────────────────────
// Rounded two-team pick card. Optional label above. Stacks the two teams with
// a divider; clicking a team selects the winner.

export function MatchupCard({
  label,
  team1,
  team2,
  winner,
  onPick,
  size = 'md',
  className = '',
}: {
  label?: string
  team1: Team | null
  team2: Team | null
  winner: 0 | 1 | null
  onPick: (side: 0 | 1) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const canPick = !!team1 && !!team2
  const width = size === 'lg' ? 'min-w-[200px]' : size === 'sm' ? 'min-w-[140px]' : 'min-w-[164px]'

  return (
    <div className={`flex flex-col ${width} ${className}`}>
      {label && (
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          {label}
        </p>
      )}
      <div className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 shadow-card">
        <TeamPill
          team={team1}
          selected={winner === 0}
          disabled={!canPick}
          onClick={canPick ? () => onPick(0) : undefined}
          className="rounded-none border-0"
        />
        <TeamPill
          team={team2}
          selected={winner === 1}
          disabled={!canPick}
          onClick={canPick ? () => onPick(1) : undefined}
          className="rounded-none border-0"
        />
      </div>
    </div>
  )
}
