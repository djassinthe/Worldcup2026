import type { ReactNode } from 'react'
import { Card } from './Card'

// ─── StatCard ─────────────────────────────────────────────────────────────────
// Compact stat with strong number-first hierarchy (big condensed value on top,
// small uppercase label below). Group several with <StatCardGroup>.

export function StatCard({
  icon,
  value,
  label,
  accent = 'default',
}: {
  icon?: ReactNode
  value: ReactNode
  label?: ReactNode
  accent?: 'default' | 'gold'
}) {
  return (
    <div className="flex flex-1 items-center gap-4 border-r border-gray-200 px-7 py-8 last:border-r-0">
      {icon && (
        <span className={accent === 'gold' ? 'text-brand-gold' : 'text-gray-400'}>{icon}</span>
      )}
      <div className="min-w-0">
        <p className="font-condensed text-[46px] font-800 leading-none tracking-[-0.01em] text-gray-900">
          {value}
        </p>
        {label && (
          <p className="mt-2 text-[12px] font-semibold uppercase leading-[1.2] tracking-[0.05em] text-gray-400">
            {label}
          </p>
        )}
      </div>
    </div>
  )
}

export function StatCardGroup({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <Card className={`flex flex-wrap ${className}`}>{children}</Card>
}
