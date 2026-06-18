// ─── Design tokens ──────────────────────────────────────────────────────────
// Single source of truth for brand visuals shared across the app.
// Most styling is expressed with Tailwind utilities (see index.css @theme);
// these JS tokens cover cases Tailwind can't express statically — dynamic
// per-user colors and SVG gradient stops.

export const brand = {
  navy: '#003087',
  navyDark: '#00214d',
  red: '#c8102e',
  redDark: '#a00d25',
  gold: '#f5a623',
} as const

// ─── Avatar ───────────────────────────────────────────────────────────────────
// Deterministic colour per pseudo so a player always gets the same avatar.

const AVATAR_PALETTE = [
  '#003087', '#7c3aed', '#16a34a', '#d97706', '#dc2626',
  '#0891b2', '#6b7280', '#db2777', '#0d9488', '#9333ea',
]

export function avatarColor(p: string) {
  let h = 0
  for (let i = 0; i < p.length; i++) h = p.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]
}

export function initials(p: string) {
  const text = p.trim()
  if (!text) return '?'

  for (const ch of Array.from(text)) {
    if (/\p{L}|\p{N}/u.test(ch)) return ch.toUpperCase()
  }

  return '?'
}

// ─── Medal palettes ─────────────────────────────────────────────────────────
// Metallic gold / silver / bronze used by the <Medal> rank badge.

export interface MedalPalette {
  light: string
  mid: string
  dark: string
  rim: string
  rimDark: string
  num: string
  numHi: string
}

export const MEDAL_PALETTE: Record<number, MedalPalette> = {
  1: { light: '#f7e9a8', mid: '#dcc05a', dark: '#a07d21', rim: '#caa42a', rimDark: '#806515', num: '#6f5410', numHi: '#fff6d0' },
  2: { light: '#f3f6fa', mid: '#c4ccd8', dark: '#828b99', rim: '#aab2bf', rimDark: '#6c7480', num: '#565d68', numHi: '#ffffff' },
  3: { light: '#e8c594', mid: '#bd7e3f', dark: '#7c4d22', rim: '#a86a30', rimDark: '#6c4420', num: '#583718', numHi: '#f5dcb6' },
}
