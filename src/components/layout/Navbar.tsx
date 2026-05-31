import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, Calendar, LayoutDashboard, User, LogOut, Shield } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/matchs', icon: Calendar, label: 'Matchs' },
  { to: '/classement', icon: Trophy, label: 'Classement' },
  { to: '/profil', icon: User, label: 'Mon profil' },
]

export default function Navbar() {
  const { player, isAdmin, logout } = useAuth()
  const location = useLocation()

  return (
    <header className="sticky top-0 z-50 bg-[#060d1a]/95 backdrop-blur border-b border-[#1e3a5f]">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/matchs" className="flex items-center gap-2 group">
          <span className="text-2xl">⚽</span>
          <div className="leading-tight">
            <div className="font-heading text-xl text-[#f5c518] tracking-wider">
              WORLDCUP
            </div>
            <div className="text-[10px] text-slate-400 -mt-1 tracking-widest uppercase">
              Famille 2026
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'text-[#f5c518]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-white/5 rounded-lg"
                  />
                )}
                <Icon size={16} />
                <span className="relative">{label}</span>
              </Link>
            )
          })}
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/admin'
                  ? 'text-[#f5c518]'
                  : 'text-purple-400 hover:text-purple-300 hover:bg-white/5'
              }`}
            >
              <Shield size={16} />
              Admin
            </Link>
          )}
        </nav>

        {/* User + logout */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-2 text-sm">
            <span className="w-7 h-7 rounded-full bg-[#1e3a5f] flex items-center justify-center text-[#f5c518] font-bold text-xs uppercase">
              {player?.pseudo?.[0]}
            </span>
            <span className="text-slate-300">{player?.pseudo}</span>
          </span>
          <button
            onClick={logout}
            title="Se déconnecter"
            className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#060d1a]/95 backdrop-blur border-t border-[#1e3a5f] flex">
        {[...navItems, ...(isAdmin ? [{ to: '/admin', icon: LayoutDashboard, label: 'Admin' }] : [])].map(
          ({ to, icon: Icon, label }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                  active ? 'text-[#f5c518]' : 'text-slate-500'
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
