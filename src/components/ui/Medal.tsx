import { useId } from 'react'
import { MEDAL_PALETTE } from './tokens'

// ─── Medal ────────────────────────────────────────────────────────────────────
// Realistic metallic rank badge (gold / silver / bronze). Ranks 4+ render a
// simple neutral circular badge. Shared between podium cards and leaderboard
// rows so the rank visual language stays identical across the page.

export function Medal({ rank, size = 36 }: { rank: number; size?: number }) {
  const raw = useId()
  const uid = raw.replace(/[^a-zA-Z0-9]/g, '')
  const m = MEDAL_PALETTE[rank]

  if (!m) {
    return (
      <div
        className="flex items-center justify-center rounded-full border border-[#e3e6ea] bg-[#f1f3f5] font-700 leading-none text-gray-400"
        style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      >
        {rank}
      </div>
    )
  }

  const fg = `f${uid}`, rg = `r${uid}`, sh = `s${uid}`, ds = `d${uid}`
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className="block shrink-0">
      <defs>
        <radialGradient id={fg} cx="38%" cy="30%" r="75%">
          <stop offset="0%" stopColor={m.light} />
          <stop offset="52%" stopColor={m.mid} />
          <stop offset="100%" stopColor={m.dark} />
        </radialGradient>
        <linearGradient id={rg} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={m.rim} />
          <stop offset="100%" stopColor={m.rimDark} />
        </linearGradient>
        <radialGradient id={sh} cx="34%" cy="26%" r="42%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id={ds} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1.1" stdDeviation="1.1" floodColor="#1a1205" floodOpacity="0.3" />
        </filter>
      </defs>
      <g filter={`url(#${ds})`}>
        <circle cx="20" cy="20" r="18.5" fill={`url(#${rg})`} />
        <circle cx="20" cy="20" r="15.2" fill={`url(#${fg})`} />
        <circle cx="20" cy="20" r="15.2" fill="none" stroke={m.rimDark} strokeOpacity="0.3" strokeWidth="0.6" />
        <circle cx="20" cy="20" r="13.6" fill="none" stroke={m.light} strokeOpacity="0.45" strokeWidth="0.7" />
        <ellipse cx="15" cy="13" rx="9" ry="6" fill={`url(#${sh})`} />
      </g>
      <text x="20" y="21.1" textAnchor="middle" dominantBaseline="central" fontFamily="inherit" fontWeight="800" fontSize="18" fill={m.numHi} fillOpacity="0.55">{rank}</text>
      <text x="20" y="20.3" textAnchor="middle" dominantBaseline="central" fontFamily="inherit" fontWeight="800" fontSize="18" fill={m.num}>{rank}</text>
    </svg>
  )
}
