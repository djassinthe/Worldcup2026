import type { ReactNode } from 'react'
import { Card, CardHeader } from './Card'

// ─── InfoWidget ─────────────────────────────────────────────────────────────
// Titled sidebar card (header strip + body). Used for the leaderboard side
// widgets and any small informational panel.

export function InfoWidget({
  title,
  icon,
  accent = 'navy',
  children,
  className = '',
}: {
  title: ReactNode
  icon?: ReactNode
  accent?: 'navy' | 'red'
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={className}>
      <CardHeader>
        {icon}
        <span
          className={`font-condensed text-sm font-700 uppercase tracking-[0.05em] ${
            accent === 'red' ? 'text-brand-red' : 'text-gray-900'
          }`}
        >
          {title}
        </span>
      </CardHeader>
      {children}
    </Card>
  )
}
