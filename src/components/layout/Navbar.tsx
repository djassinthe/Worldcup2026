import { Link, useLocation } from 'react-router-dom'
import { Trophy, Calendar, User, LogOut, Shield } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/matchs', icon: Calendar, label: 'Pronostics' },
  { to: '/classement', icon: Trophy, label: 'Classement' },
  { to: '/profil', icon: User, label: 'Mon profil' },
]

export default function Navbar() {
  const { player, isAdmin, logout } = useAuth()
  const location = useLocation()

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/matchs" className="flex items-center gap-2 shrink-0">
          <span className="text-xl">⚽</span>
          <span className="font-semibold text-gray-900 dark:text-slate-100 text-sm leading-tight">
            Famille 2026
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {navItems.map(({ to, label }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100'
                }`}
              >
                {label}
              </Link>
            )
          })}
          {isAdmin && (
            <Link
              to="/admin"
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                location.pathname === '/admin'
                  ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                  : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              <Shield size={13} />
              Admin
            </Link>
          )}
        </nav>

        {/* User + logout */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-xs uppercase">
              {player?.pseudo?.[0]}
            </span>
            <span className="text-sm text-gray-700 dark:text-slate-300 font-medium">{player?.pseudo}</span>
          </div>
          <button
            onClick={logout}
            title="Se déconnecter"
            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex">
        {[...navItems, ...(isAdmin ? [{ to: '/admin', icon: Shield, label: 'Admin' }] : [])].map(
          ({ to, icon: Icon, label }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                  active
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-slate-500'
                }`}
              >
                <Icon size={20} />
                {label}
              </Link>
            )
          }
        )}
      </nav>
    </header>
  )
}
