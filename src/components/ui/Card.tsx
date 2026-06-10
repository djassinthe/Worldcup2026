import type { HTMLAttributes, ReactNode } from 'react'

// ─── Card ─────────────────────────────────────────────────────────────────────
// Rounded white surface with a subtle shadow. Set `interactive` for clickable
// cards (hover lift + stronger shadow).

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

export function Card({ interactive = false, className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-card ${
        interactive ? 'cursor-pointer transition duration-150 hover:-translate-y-0.5 hover:shadow-card-hover' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`flex items-center gap-2 border-b border-gray-100 px-4 py-3.5 ${className}`}>
      {children}
    </div>
  )
}
