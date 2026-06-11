import { useState } from 'react'
import { User, Lock, Trophy, ArrowRight } from 'lucide-react'
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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-[#03061a] via-[#03143f] to-[#002b73]">
      {/* decorative gold + navy glows — site signature */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(245,166,35,0.18)_0%,transparent_68%)]" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(0,48,135,0.45)_0%,transparent_70%)]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[360px] w-[860px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(245,166,35,0.10)_0%,transparent_60%)]" />

      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-10">

        {/* Hero — mainlogo_v2.png contains title + icons */}
        <div className="mb-8 w-full max-w-xl drop-shadow-[0_18px_44px_rgba(0,0,0,0.45)]">
          <img
            src="/Worldcup2026/mainlogo_v2.png"
            alt="Coupe du Monde 2026"
            className="h-auto w-full object-contain"
          />
        </div>

        {/* Card */}
        <div className="w-full max-w-sm overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_30px_80px_rgba(0,10,40,0.55),0_2px_8px_rgba(0,10,40,0.3)]">
          {/* gradient header — same family as the page header cards */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#003087] via-[#002b73] to-[#1f3a6e] px-7 py-6">
            <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(245,166,35,0.22)_0%,transparent_70%)]" />
            <p className="relative mb-1.5 inline-flex items-center gap-2 text-[11px] font-700 uppercase tracking-[0.24em] text-white/60">
              <Trophy size={14} className="text-[#f5a623]" /> FIFA World Cup 2026
            </p>
            <h2 className="relative font-condensed text-[28px] font-800 uppercase leading-none tracking-wide text-white">
              Connexion
            </h2>
            <p className="relative mt-1.5 text-[12px] text-white/65">Entre ton prénom et le code famille</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 px-7 py-7">
            <div>
              <label className="mb-1.5 block text-[11px] font-700 uppercase tracking-[0.18em] text-gray-500">
                Prénom
              </label>
              <div className="group relative">
                <User size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-brand-navy" />
                <input
                  type="text"
                  value={pseudo}
                  onChange={e => setPseudo(e.target.value)}
                  placeholder="Ex. : Marie"
                  autoComplete="off"
                  className="w-full rounded-xl border-2 border-gray-200 bg-gray-50/50 py-2.5 pl-11 pr-3.5 text-[15px] font-medium text-gray-900 placeholder-gray-300 outline-none transition-colors focus:border-brand-navy focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-700 uppercase tracking-[0.18em] text-gray-500">
                Code d'accès
              </label>
              <div className="group relative">
                <Lock size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-brand-navy" />
                <input
                  type="password"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="off"
                  className="w-full rounded-xl border-2 border-gray-200 bg-gray-50/50 py-2.5 pl-11 pr-3.5 text-[15px] font-medium text-gray-900 placeholder-gray-300 outline-none transition-colors focus:border-brand-navy focus:bg-white"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border-l-4 border-brand-red bg-red-50 px-3.5 py-2.5">
                <p className="text-[13px] font-600 text-brand-red">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#003087] to-[#1f3a6e] py-3.5 text-[13px] font-700 uppercase tracking-[0.12em] text-white shadow-[0_10px_28px_rgba(0,30,90,0.4)] transition-all hover:shadow-[0_14px_36px_rgba(0,30,90,0.55)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Connexion…' : 'Entrer dans le jeu'}
              {!loading && <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-8 text-[11px] uppercase tracking-[0.2em] text-white/35">
          USA · Canada · Mexique · 11 juin – 19 juillet 2026
        </p>
      </div>
    </div>
  )
}
