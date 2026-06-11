import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/bracket', label: 'Bracket', mobileLabel: 'Bracket' },
  { to: '/classement', label: 'Classement', mobileLabel: 'Classement' },
  { to: '/profil', label: 'Mon profil', mobileLabel: 'Profil' },
  { to: '/aide', label: 'Aide', mobileLabel: 'Aide' },
]

export default function Navbar() {
  const { player, isAdmin, logout } = useAuth()
  const location = useLocation()
  const items = [...navItems, ...(isAdmin ? [{ to: '/admin', label: 'Admin', mobileLabel: 'Admin' }] : [])]

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-br from-[#003087] via-[#002b73] to-[#1f3a6e] shadow-[0_14px_44px_rgba(0,20,60,0.32),0_2px_6px_rgba(0,20,60,0.18)]">
        {/* decorative gold glow — same signature as the page header cards */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-72 bg-[radial-gradient(circle_at_top_right,rgba(245,166,35,0.16)_0%,transparent_70%)]" />
        {/* gold hairline accent */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#f5a623]/45 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex h-16 items-center justify-between gap-4">

            {/* Logo */}
            <Link to="/bracket" className="flex shrink-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-[0_4px_14px_rgba(0,20,60,0.30)] ring-1 ring-white/40">
                <img
                  src="/Worldcup2026/logo.png"
                  alt="Logo"
                  className="h-full w-full scale-[1.9] object-contain"
                />
              </div>
              <div className="hidden flex-col leading-none sm:flex">
                <span className="font-condensed text-[11px] font-600 uppercase tracking-[0.25em] text-white/60">
                  Coupe du Monde
                </span>
                <span className="font-condensed text-[19px] font-800 uppercase leading-none tracking-wide text-white">
                  2026 <span className="text-[#f5a623]">⬥</span>
                </span>
              </div>
            </Link>

            {/* Desktop nav — premium pills */}
            <nav className="hidden h-full flex-1 items-center justify-center gap-1.5 md:flex">
              {items.map(({ to, label }) => {
                const active = location.pathname === to
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`relative flex items-center whitespace-nowrap rounded-xl px-6 py-2.5 text-[13px] font-bold uppercase tracking-[0.1em] transition-all duration-200
                      ${active
                        ? 'bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                        : 'text-white/55 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    {label}
                    {active && (
                      <span className="absolute -bottom-px left-1/2 h-[3px] w-7 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#f5a623] to-[#f7b94e] shadow-[0_0_10px_rgba(245,166,35,0.6)]" />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* User chip + logout */}
            <div className="flex shrink-0 items-center gap-3 border-l border-white/10 pl-4">
              <div className="hidden items-center gap-2.5 sm:flex">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#f5a623] to-[#f7b94e] text-[12px] font-black uppercase text-[#003087] shadow-[0_4px_12px_rgba(245,166,35,0.35)]">
                  {player?.pseudo?.[0]}
                </span>
                <span className="hidden text-[13px] font-semibold text-white/90 lg:block">{player?.pseudo}</span>
              </div>
              <button
                onClick={logout}
                className="rounded-xl px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.08em] text-white/45 transition-colors hover:bg-white/5 hover:text-white/90"
              >
                Quitter
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-white/10 bg-gradient-to-br from-[#003087] via-[#002b73] to-[#1f3a6e] shadow-[0_-8px_28px_rgba(0,20,60,0.28)] md:hidden">
        {items.map(({ to, mobileLabel }) => {
          const active = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              className={`relative flex-1 py-3 text-center text-[11px] font-semibold uppercase tracking-wide transition-colors
                ${active
                  ? 'text-[#f5a623]'
                  : 'text-white/50 hover:text-white/80'
                }`}
            >
              {mobileLabel}
              {active && (
                <span className="absolute inset-x-0 top-0 mx-auto h-[3px] w-10 rounded-full bg-gradient-to-r from-[#f5a623] to-[#f7b94e] shadow-[0_0_10px_rgba(245,166,35,0.6)]" />
              )}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
