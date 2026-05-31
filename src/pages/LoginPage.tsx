import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const [pseudo, setPseudo] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pseudo.trim() || !code.trim()) {
      setError('Remplis tous les champs.')
      return
    }
    setLoading(true)
    setError('')
    const ok = await login(pseudo.trim(), code.trim())
    if (!ok) {
      setError('Code incorrect. Contacte l\'administrateur.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#003087] flex flex-col">
      {/* Top banner */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">⚽</div>
          <h1 className="font-condensed text-5xl font-800 text-white uppercase tracking-wider leading-none">
            Coupe du Monde
          </h1>
          <p className="font-condensed text-5xl font-800 text-[#f5a623] uppercase tracking-wider leading-none mt-1">
            2026
          </p>
          <p className="mt-4 text-white/60 text-[14px] font-medium uppercase tracking-widest">
            Jeu de pronostics · Famille
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm bg-white shadow-2xl">
          <div className="bg-[#c8102e] px-6 py-4">
            <h2 className="font-condensed text-[20px] font-700 text-white uppercase tracking-wider">
              Connexion
            </h2>
            <p className="text-white/70 text-[12px] mt-0.5">Entre ton prénom et le code famille</p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
                Prénom
              </label>
              <input
                type="text"
                value={pseudo}
                onChange={e => setPseudo(e.target.value)}
                placeholder="Ex. : Marie"
                autoComplete="off"
                className="w-full border-2 border-gray-200 focus:border-[#003087] outline-none px-3 py-2.5 text-[15px] font-medium text-gray-900 placeholder-gray-300 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
                Code d'accès
              </label>
              <input
                type="password"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="••••••••"
                autoComplete="off"
                className="w-full border-2 border-gray-200 focus:border-[#003087] outline-none px-3 py-2.5 text-[15px] font-medium text-gray-900 placeholder-gray-300 transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-[#c8102e] px-3 py-2">
                <p className="text-[13px] text-[#c8102e] font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#003087] hover:bg-[#001e5c] text-white font-semibold uppercase tracking-widest text-[13px] py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connexion…' : 'Entrer dans le jeu'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-8 text-white/30 text-[11px] uppercase tracking-widest">
          USA · Canada · Mexique · 11 juin – 19 juillet 2026
        </p>
      </div>
    </div>
  )
}
