import { Check } from 'lucide-react'
import type { Team } from '../../utils/bracketData'

// ─── TeamPill ─────────────────────────────────────────────────────────────────
// Rounded selectable team chip with flag. Navy when selected. Renders a dashed
// placeholder when no team is set.

export function TeamPill({
  team,
  selected = false,
  disabled = false,
  onClick,
  placeholder = 'À déterminer',
  className = '',
}: {
  team: Team | null
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  placeholder?: string
  className?: string
}) {
  if (!team) {
    return (
      <div
        className={`flex min-w-[148px] items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2.5 text-[13px] italic text-gray-400 ${className}`}
      >
        <span>{placeholder}</span>
      </div>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full min-w-[148px] items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-colors ${
        selected
          ? 'bg-brand-navy text-white'
          : disabled
            ? 'cursor-default border border-gray-200 bg-white text-gray-400'
            : 'cursor-pointer border border-gray-200 bg-white text-gray-900 hover:bg-gray-50'
      } ${className}`}
    >
      <span className="text-sm leading-none">{team.flag}</span>
      <span className="flex-1 truncate">{team.name}</span>
      {selected && <Check size={12} className="ml-auto shrink-0" strokeWidth={3} />}
    </button>
  )
}
