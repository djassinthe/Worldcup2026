import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// ─── AppHeader ────────────────────────────────────────────────────────────────
// Navy top navigation with gold active accent + mobile bottom nav. Rounded
// logo tile, condensed wordmark. (Refactor of the legacy Navbar — wired in a
// later phase.)

const NAV_ITEMS = [
  { to: '/bracket', label: 'Bracket', mobileLabel: 'Bracket' },
  { to: '/classement', label: 'Classement', mobileLabel: 'Classement' },
  { to: '/profil', label: 'Mon profil', mobileLabel: 'Profil' },
  { to: '/aide', label: 'Aide', mobileLabel: 'Aide' },
]

export function AppHeader() {
  const { player, isAdmin, logout } = useAuth()
  const location = useLocation()
  const items = [...NAV_ITEMS, ...(isAdmin ? [{ to: '/admin', label: 'Admin', mobileLabel: 'Admin' }] : [])]

  return (
    <>
      <header className="sticky top-0 z-50 bg-brand-navy shadow-lg">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/bracket" className="flex shrink-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                <img src="/Worldcup2026/logo.png" alt="Logo" className="h-full w-full scale-[1.9] object-contain" />
              </div>
              <div className="hidden flex-col leading-none sm:flex">
                <span className="font-condensed text-[11px] font-600 uppercase tracking-[0.25em] text-white/60">
                  Coupe du Monde
                </span>
                <span className="font-condensed text-[19px] font-800 uppercase leading-none tracking-wide text-white">
                  2026
                </span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden h-full flex-1 items-center justify-center md:flex">
              {items.map(({ to, label }) => {
                const active = location.pathname === to
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`relative flex h-full items-center whitespace-nowrap px-7 text-[13px] font-bold uppercase tracking-[0.1em] transition-colors ${
                      active ? 'text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {label}
                    {active && <span className="absolute bottom-0 left-4 right-4 h-[3px] rounded-t-sm bg-brand-gold" />}
                  </Link>
                )
              })}
            </nav>

            {/* User chip + logout */}
            <div className="flex shrink-0 items-center gap-3 border-l border-white/10 pl-4">
              <div className="hidden items-center gap-2.5 sm:flex">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gold text-[12px] font-black uppercase text-brand-navy">
                  {player?.pseudo?.[0]}
                </span>
                <span className="hidden text-[13px] font-semibold text-white/90 lg:block">{player?.pseudo}</span>
              </div>
              <button
                onClick={logout}
                className="text-[12px] font-bold uppercase tracking-[0.08em] text-white/40 transition-colors hover:text-white/80"
              >
                Quitter
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-white/10 bg-brand-navy md:hidden">
        {items.map(({ to, mobileLabel }) => {
          const active = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              className={`flex-1 py-3 text-center text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                active ? 'border-t-2 border-brand-gold text-brand-gold' : 'text-white/50 hover:text-white/80'
              }`}
            >
              {mobileLabel}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
