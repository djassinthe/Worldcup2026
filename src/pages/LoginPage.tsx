import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const { login, loginAdmin } = useAuth()
  const navigate = useNavigate()
  const [pseudo, setPseudo] = useState('')
  const [code, setCode] = useState('')
  const [adminCode, setAdminCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await login(pseudo, code)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      navigate('/matchs')
    }
  }

  function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault()
    if (loginAdmin(adminCode)) {
      navigate('/admin')
    } else {
      setError('Code admin incorrect.')
    }
  }

  return (
    <div className="min-h-dvh bg-[#060d1a] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-[#0f2040] via-[#060d1a] to-[#060d1a]" />

      {/* Animated blobs */}
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-[#f5c518]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="text-7xl mb-4"
          >
            ⚽
          </motion.div>
          <h1 className="font-heading text-5xl text-[#f5c518] tracking-wider mb-2">
            WORLDCUP 2026
          </h1>
          <p className="text-slate-400 text-sm tracking-widest uppercase">
            Jeu de pronostics · Famille
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#111e35] border border-[#1e3a5f] rounded-2xl p-8 shadow-2xl">
          {!showAdmin ? (
            <>
              <h2 className="font-heading text-2xl text-white mb-6 text-center tracking-wide">
                REJOINDRE LE JEU
              </h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">
                    Ton pseudo
                  </label>
                  <input
                    type="text"
                    value={pseudo}
                    onChange={e => setPseudo(e.target.value)}
                    placeholder="Ex: SuperMario"
                    maxLength={20}
                    required
                    className="w-full px-4 py-3 bg-[#0a1628] border border-[#1e3a5f] rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">
                    Code famille
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="••••••••••"
                    required
                    className="w-full px-4 py-3 bg-[#0a1628] border border-[#1e3a5f] rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors tracking-widest"
                  />
                </div>
                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-400 text-sm text-center"
                  >
                    {error}
                  </motion.p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#f5c518] text-[#060d1a] font-bold rounded-xl hover:bg-[#fde68a] disabled:opacity-50 transition-colors font-heading text-lg tracking-wider"
                >
                  {loading ? 'Connexion…' : "C'EST PARTI !"}
                </button>
              </form>
              <button
                onClick={() => { setShowAdmin(true); setError('') }}
                className="mt-4 w-full text-xs text-slate-600 hover:text-slate-400 transition-colors py-1"
              >
                Accès admin
              </button>
            </>
          ) : (
            <>
              <h2 className="font-heading text-2xl text-purple-400 mb-6 text-center tracking-wide">
                ACCÈS ADMIN
              </h2>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">
                    Code admin
                  </label>
                  <input
                    type="password"
                    value={adminCode}
                    onChange={e => setAdminCode(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-[#0a1628] border border-[#1e3a5f] rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                {error && (
                  <p className="text-red-400 text-sm text-center">{error}</p>
                )}
                <button
                  type="submit"
                  className="w-full py-3.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 transition-colors font-heading text-lg tracking-wider"
                >
                  CONNEXION ADMIN
                </button>
              </form>
              <button
                onClick={() => { setShowAdmin(false); setError('') }}
                className="mt-4 w-full text-xs text-slate-600 hover:text-slate-400 transition-colors py-1"
              >
                ← Retour
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
