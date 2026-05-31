import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const { login, loginAdmin, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [pseudo, setPseudo] = useState('')
  const [code, setCode] = useState('')
  const [adminCode, setAdminCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)

  useEffect(() => {
    if (isAdmin) navigate('/admin')
  }, [isAdmin])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await login(pseudo.trim(), code.trim())
    setLoading(false)
    if (result.error) setError(result.error)
    else navigate('/bracket')
  }

  function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!loginAdmin(adminCode)) setError('Code admin incorrect.')
  }

  return (
    <div className="min-h-dvh bg-white dark:bg-[#202124] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[#e8eaed]">Coupe du Monde 2026</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Coupe du Monde · Famille</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
          {!showAdmin ? (
            <>
              <h2 className="font-semibold text-gray-900 dark:text-slate-100 mb-5">Rejoindre le jeu</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide block mb-1.5">
                    Ton prénom / pseudo
                  </label>
                  <input
                    type="text"
                    value={pseudo}
                    onChange={e => setPseudo(e.target.value)}
                    placeholder="Ex : Mario"
                    required
                    className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-[#3c4043] bg-white dark:bg-[#292a2d] text-gray-900 dark:text-[#e8eaed] placeholder-gray-400 dark:placeholder-[#5f6368] focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent transition text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-[#9aa0a6] uppercase tracking-wide block mb-1.5">
                    Code famille
                  </label>
                  <input
                    type="password"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-[#3c4043] bg-white dark:bg-[#292a2d] text-gray-900 dark:text-[#e8eaed] placeholder-gray-400 dark:placeholder-[#5f6368] focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent transition text-sm"
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#1a73e8] hover:bg-[#1765cc] text-white font-semibold transition-colors disabled:opacity-60 text-sm"
                >
                  {loading ? 'Connexion…' : "C'est parti !"}
                </button>
              </form>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 text-center">
                <button
                  onClick={() => { setShowAdmin(true); setError('') }}
                  className="text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                >
                  Accès administrateur
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="font-semibold text-gray-900 dark:text-slate-100 mb-5">Administration</h2>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide block mb-1.5">
                    Code admin
                  </label>
                  <input
                    type="password"
                    value={adminCode}
                    onChange={e => setAdminCode(e.target.value)}
                    required
                    autoFocus
                    className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-[#3c4043] bg-white dark:bg-[#292a2d] text-gray-900 dark:text-[#e8eaed] focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent transition text-sm"
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#1a73e8] hover:bg-[#1765cc] text-white font-semibold transition-colors text-sm"
                >
                  Connexion
                </button>
              </form>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 text-center">
                <button
                  onClick={() => { setShowAdmin(false); setError('') }}
                  className="text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                >
                  ← Retour
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
