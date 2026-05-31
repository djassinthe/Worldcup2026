/**
 * LogoMark — Coupe du Monde 2026
 * Soccer ball + tournament bracket structure + red swoosh arc
 * Color variants: 'white' (on dark bg) | 'navy' (on light bg)
 */
export function LogoMark({
  size = 40,
  variant = 'white',
  className = '',
}: {
  size?: number
  variant?: 'white' | 'navy'
  className?: string
}) {
  const ball = variant === 'white' ? '#ffffff' : '#003087'
  const ballFill = variant === 'white' ? 'rgba(255,255,255,0.08)' : 'rgba(0,48,135,0.06)'
  const bracket = variant === 'white' ? '#ffffff' : '#003087'
  const red = '#c8102e'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-label="Coupe du Monde 2026"
      className={className}
    >
      {/* ── Left bracket ─────────────────────────────── */}
      <path d="M14 16 H8 V32 H14" stroke={bracket} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Left connector lines */}
      <line x1="8" y1="21" x2="12" y2="21" stroke={bracket} strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="27" x2="12" y2="27" stroke={bracket} strokeWidth="2" strokeLinecap="round" />

      {/* ── Right bracket ────────────────────────────── */}
      <path d="M34 16 H40 V32 H34" stroke={bracket} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Right connector lines */}
      <line x1="40" y1="21" x2="36" y2="21" stroke={bracket} strokeWidth="2" strokeLinecap="round" />
      <line x1="40" y1="27" x2="36" y2="27" stroke={bracket} strokeWidth="2" strokeLinecap="round" />

      {/* ── Ball circle ──────────────────────────────── */}
      <circle cx="24" cy="24" r="10.5" fill={ballFill} stroke={ball} strokeWidth="2.2" />

      {/* ── Ball internal pattern (simplified pentagon/hex) */}
      {/* Central hexagon */}
      <polygon
        points="24,18.5 27.5,20.5 27.5,24.5 24,26.5 20.5,24.5 20.5,20.5"
        stroke={ball}
        strokeWidth="1.4"
        fill="none"
        opacity="0.55"
      />
      {/* Radiating lines from pentagon to edge */}
      <line x1="24" y1="13.5" x2="24" y2="18.5" stroke={ball} strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
      <line x1="27.5" y1="20.5" x2="31.5" y2="18.5" stroke={ball} strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
      <line x1="27.5" y1="24.5" x2="31.5" y2="27" stroke={ball} strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
      <line x1="24" y1="26.5" x2="24" y2="31.5" stroke={ball} strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
      <line x1="20.5" y1="24.5" x2="16.5" y2="27" stroke={ball} strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
      <line x1="20.5" y1="20.5" x2="16.5" y2="18.5" stroke={ball} strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />

      {/* ── Red swoosh arc (top of ball) ─────────────── */}
      <path
        d="M15.5 19 Q20 10.5 32.5 15"
        stroke={red}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* ── Stand / pedestal ─────────────────────────── */}
      <line x1="24" y1="34.5" x2="24" y2="38" stroke={ball} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <line x1="20.5" y1="38" x2="27.5" y2="38" stroke={ball} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </svg>
  )
}
