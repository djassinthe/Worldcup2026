import { Link, useLocation } from 'react-router-dom'
import { LogOut, Shield } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/bracket', label: 'Phase éliminatoire' },
  { to: '/classement', label: 'Classement' },
  { to: '/profil', label: 'Mon profil' },
]

export default function Navbar() {
  const { player, isAdmin, logout } = useAuth()
  const location = useLocation()

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-[#202124] border-b border-gray-200 dark:border-[#3c4043]">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/bracket" className="shrink-0">
            <span className="text-[15px] font-medium text-gray-900 dark:text-[#e8eaed] tracking-tight">
              Coupe du Monde 2026
            </span>
          </Link>

          {/* Desktop nav — tabs style Google */}
          <nav className="hidden md:flex items-end h-full gap-0">
            {navItems.map(({ to, label }) => {
              const active = location.pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  className={`relative px-4 h-full flex items-center text-[13px] font-medium transition-colors
                    ${active
                      ? 'text-[#1a73e8] dark:text-[#8ab4f8]'
                      : 'text-[#5f6368] dark:text-[#9aa0a6] hover:text-gray-900 dark:hover:text-[#e8eaed] hover:bg-gray-50 dark:hover:bg-[#2d2e30]'
                    }`}
                >
                  {label}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1a73e8] dark:bg-[#8ab4f8]" />
                  )}
                </Link>
              )
            })}
            {isAdmin && (
              <Link
                to="/admin"
                className={`relative px-4 h-full flex items-center gap-1.5 text-[13px] font-medium transition-colors
                  ${location.pathname === '/admin'
                    ? 'text-[#1a73e8] dark:text-[#8ab4f8]'
                    : 'text-[#5f6368] dark:text-[#9aa0a6] hover:text-gray-900 dark:hover:text-[#e8eaed] hover:bg-gray-50 dark:hover:bg-[#2d2e30]'
                  }`}
              >
                <Shield size={13} />
                Admin
                {location.pathname === '/admin' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1a73e8] dark:bg-[#8ab4f8]" />
                )}
              </Link>
            )}
          </nav>

          {/* User + logout */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:block text-[13px] text-[#5f6368] dark:text-[#9aa0a6]">
              {player?.pseudo}
            </span>
            <button
              onClick={logout}
              title="Se déconnecter"
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-[#5f6368] dark:text-[#9aa0a6] hover:text-gray-900 dark:hover:text-[#e8eaed] hover:bg-gray-100 dark:hover:bg-[#2d2e30] transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#202124] border-t border-gray-200 dark:border-[#3c4043] flex">
        {[...navItems, ...(isAdmin ? [{ to: '/admin', label: 'Admin' }] : [])].map(({ to, label }) => {
          const active = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              className={`flex-1 py-3 text-center text-xs font-medium transition-colors
                ${active
                  ? 'text-[#1a73e8] dark:text-[#8ab4f8] border-t-2 border-[#1a73e8] dark:border-[#8ab4f8]'
                  : 'text-[#5f6368] dark:text-[#9aa0a6]'
                }`}
            >
              {label === 'Phase éliminatoire' ? 'Bracket' : label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}

