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
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-stretch justify-between h-16">

            {/* Logo */}
            <Link to="/bracket" className="shrink-0 flex items-center gap-3 pr-8">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-white shrink-0 flex items-center justify-center">
                <img
                  src="/Worldcup2026/logo.png"
                  alt="Logo"
                  className="w-[140%] h-[140%] object-contain scale-[1.4]"
                />
              </div>
              <div className="hidden sm:flex flex-col leading-none">
                <span className="font-condensed text-[11px] font-600 tracking-[0.25em] text-white/60 uppercase">
                  Coupe du Monde
                </span>
                <span className="font-condensed text-[19px] font-800 tracking-wide text-white uppercase leading-none">
                  2026 <span className="text-[#f5a623]">⬥</span>
                </span>
              </div>
            </Link>

            {/* Desktop nav — ESPN style: centered, generous padding, clear active underline */}
            <nav className="hidden md:flex items-stretch h-full">
              {navItems.map(({ to, label }) => {
                const active = location.pathname === to
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`relative flex items-center px-6 text-[13px] font-bold tracking-[0.08em] uppercase transition-colors whitespace-nowrap
                      ${active
                        ? 'text-white'
                        : 'text-white/55 hover:text-white hover:bg-white/5'
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
                  className={`relative flex items-center px-6 text-[13px] font-bold tracking-[0.08em] uppercase transition-colors whitespace-nowrap
                    ${location.pathname === '/admin'
                      ? 'text-white'
                      : 'text-white/55 hover:text-white hover:bg-white/5'
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
            <div className="flex items-center gap-3 shrink-0 pl-6 border-l border-white/10">
              <div className="hidden sm:flex items-center gap-2.5">
                <span className="w-8 h-8 flex items-center justify-center bg-[#f5a623] text-[#003087] text-[12px] font-black uppercase rounded-full shrink-0">
                  {player?.pseudo?.[0]}
                </span>
                <span className="text-[13px] font-semibold text-white/90 hidden lg:block">{player?.pseudo}</span>
              </div>
              <button
                onClick={logout}
                className="text-[12px] font-bold uppercase tracking-[0.08em] text-white/40 hover:text-white/80 transition-colors"
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
