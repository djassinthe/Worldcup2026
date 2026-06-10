// ─── SectionTabs ────────────────────────────────────────────────────────────
// Horizontal underline tab bar (navy active indicator). Scrolls on overflow.

export interface TabItem {
  id: string
  label: string
}

export function SectionTabs({
  tabs,
  active,
  onChange,
  className = '',
}: {
  tabs: TabItem[]
  active: string
  onChange: (id: string) => void
  className?: string
}) {
  return (
    <div className={`scrollbar-hide flex items-center overflow-x-auto ${className}`}>
      {tabs.map((t) => {
        const isActive = active === t.id
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`relative shrink-0 whitespace-nowrap px-4 py-3 text-[12px] font-bold uppercase tracking-[0.08em] transition-colors ${
              isActive ? 'text-brand-navy' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {t.label}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-sm bg-brand-navy" />
            )}
          </button>
        )
      })}
    </div>
  )
}
