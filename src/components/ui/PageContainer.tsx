import type { ReactNode } from 'react'

// ─── PageContainer ──────────────────────────────────────────────────────────
// White page surface, centered, with a responsive max width. The whole app
// sits on white (fantasy-dashboard look), the outer app shell provides the
// neutral background.

const WIDTHS = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-[1440px]',
} as const

export function PageContainer({
  children,
  width = 'xl',
  className = '',
}: {
  children: ReactNode
  width?: keyof typeof WIDTHS
  className?: string
}) {
  return (
    <div className="min-h-full w-full bg-white">
      <div className={`mx-auto ${WIDTHS[width]} ${className}`}>{children}</div>
    </div>
  )
}
