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
      className={`flex flex-col gap-6 border-b border-gray-200 px-5 pt-8 pb-6 md:px-10 lg:flex-row lg:items-start lg:justify-between lg:gap-8 ${className}`}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-navy">
            {eyebrow}
          </p>
        )}
        <h1 className="font-condensed mb-2.5 text-[44px] font-800 uppercase leading-none tracking-[0.01em] text-gray-900 md:text-[68px]">
          {title}
        </h1>
        {subtitle && (
          <p className="max-w-md text-[14px] leading-relaxed text-gray-500">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
