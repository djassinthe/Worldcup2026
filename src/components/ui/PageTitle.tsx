import type { ReactNode } from 'react'

// ─── PageTitle ──────────────────────────────────────────────────────────────
// Hero band: eyebrow + condensed uppercase H1 + subtitle, with an optional
// right-aligned action slot (e.g. a stats card). Stacks on mobile.

export function PageTitle({
  eyebrow,
  title,
  subtitle,
  action,
  className = '',
}: {
  eyebrow?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex flex-col gap-8 border-b border-gray-200 px-5 pt-12 pb-9 md:px-10 lg:flex-row lg:items-center lg:justify-between lg:gap-10 ${className}`}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-[15px] font-semibold uppercase tracking-[0.22em] text-brand-navy">
            {eyebrow}
          </p>
        )}
        <h1 className="font-condensed mb-3 text-[60px] font-800 uppercase leading-[0.95] tracking-[0.01em] text-gray-900 md:text-[94px]">
          {title}
        </h1>
        {subtitle && (
          <p className="max-w-lg text-[17px] leading-relaxed text-gray-500">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
