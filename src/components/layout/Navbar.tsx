import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/bracket', label: 'Bracket', mobileLabel: 'Bracket' },
  { to: '/classement', label: 'Classement', mobileLabel: 'Classement' },
  { to: '/profil', label: 'Mon profil', mobileLabel: 'Profil' },
]

export default function Navbar() {
  const { player, isAdmin, logout } = useAuth()
  const location = useLocation()

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#003087] shadow-lg">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-14">

            {/* Logo */}
            <Link to="/bracket" className="shrink-0 flex items-center gap-2.5">
              <span className="flex items-center justify-center w-8 h-8 bg-white/10 rounded text-white text-lg font-bold">⚽</span>
              <div className="hidden sm:block leading-tight">
                <span className="font-condensed text-[17px] font-700 tracking-wide text-white uppercase">
                  Coupe du Monde
                </span>
                <span className="ml-1.5 font-condensed text-[17px] font-700 text-[#f5a623] uppercase">2026</span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-end h-full gap-0">
              {navItems.map(({ to, label }) => {
                const active = location.pathname === to
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`relative px-4 h-full flex items-center text-[13px] font-semibold tracking-wide uppercase transition-colors
                      ${active
                        ? 'text-white'
                        : 'text-white/60 hover:text-white/90 hover:bg-white/5'
                      }`}
                  >
                    {label}
                    {active && (
                      <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#f5a623]" />
                    )}
                  </Link>
                )
              })}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`relative px-4 h-full flex items-center text-[13px] font-semibold tracking-wide uppercase transition-colors
                    ${location.pathname === '/admin'
                      ? 'text-white'
                      : 'text-white/60 hover:text-white/90 hover:bg-white/5'
                    }`}
                >
                  Admin
                  {location.pathname === '/admin' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#f5a623]" />
                  )}
                </Link>
              )}
            </nav>

            {/* User chip + logout */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded">
                <span className="w-5 h-5 flex items-center justify-center bg-[#f5a623] text-[#003087] text-[10px] font-black uppercase rounded-full">
                  {player?.pseudo?.[0]}
                </span>
                <span className="text-[12px] font-medium text-white/90">{player?.pseudo}</span>
              </div>
              <button
                onClick={logout}
                className="text-[12px] font-semibold uppercase tracking-wide text-white/50 hover:text-white transition-colors px-2 py-1"
              >
                Quitter
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#003087] border-t border-white/10 flex">
        {[...navItems, ...(isAdmin ? [{ to: '/admin', label: 'Admin', mobileLabel: 'Admin' }] : [])].map(({ to, mobileLabel }) => {
          const active = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              className={`flex-1 py-3 text-center text-[11px] font-semibold uppercase tracking-wide transition-colors
                ${active
                  ? 'text-[#f5a623] border-t-2 border-[#f5a623]'
                  : 'text-white/50 hover:text-white/80'
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
