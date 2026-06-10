import type { Team } from '../../utils/bracketData'

// ─── ChampionCard ─────────────────────────────────────────────────────────────
// Gold-accent champion display. Two variants:
//  - "compact": inline row (hero / sidebar)
//  - "full": centered card (profile)

export function ChampionCard({
  champion,
  variant = 'compact',
  label = 'Mon champion',
  className = '',
}: {
  champion: Team | { name: string; flag: string } | null
  variant?: 'compact' | 'full'
  label?: string
  className?: string
}) {
  if (!champion) {
    return variant === 'full' ? (
      <div
        className={`flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-8 text-center ${className}`}
      >
        <p className="text-[13px] text-gray-400">Champion non sélectionné</p>
      </div>
    ) : (
      <span className={`text-[13px] text-gray-400 ${className}`}>Non sélectionné</span>
    )
  }

  if (variant === 'full') {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#f0dca0] bg-gradient-to-b from-[#fef9e7] to-white px-6 py-8 shadow-card ${className}`}
      >
        <span className="text-5xl">{champion.flag}</span>
        <div className="text-center">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
          <p className="font-condensed text-[24px] font-700 uppercase tracking-wide text-[#b8860b]">
            {champion.name}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`inline-flex items-center gap-3 rounded-xl border border-[#f0dca0] bg-[#fef9e7] px-4 py-2.5 ${className}`}
    >
      <span className="text-xl">{champion.flag}</span>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
        <p className="text-[14px] font-bold text-gray-900">{champion.name}</p>
      </div>
    </div>
  )
}
