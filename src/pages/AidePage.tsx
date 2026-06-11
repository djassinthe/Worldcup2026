import { type ReactNode } from 'react'
import { Trophy, Layers, Star, CalendarDays, LogIn, Target, Crown, ListChecks, Eye, Lightbulb } from 'lucide-react'

// ════════════════════════════════════════════════════════════════════════════
//  AidePage — guide "Comment jouer" (route: /aide)
//  Visual system identical to ClassementV2.
// ════════════════════════════════════════════════════════════════════════════

function daysUntil(d: string) { return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)) }
const T_START = '2026-06-11'

// ─── Stat (identical to ClassementV2) ───────────────────────────────────────────

function Stat({ icon, value, label, gold = false }: { icon: ReactNode; value: ReactNode; label: string; gold?: boolean }) {
  return (
    <div className="flex flex-1 items-center gap-3 px-5 py-2">
      <span className={`flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-xl ${gold ? 'bg-gradient-to-br from-amber-100 to-amber-50 text-brand-gold shadow-[0_4px_12px_rgba(245,166,35,0.22)]' : 'bg-gradient-to-br from-[#eef2f8] to-[#f7f9fc] text-brand-navy'}`}>{icon}</span>
      <div className="min-w-0">
        <p className="font-condensed text-[46px] font-800 leading-none text-gray-900">{value}</p>
        <p className="mt-1 text-[11px] font-700 uppercase leading-tight tracking-[0.05em] text-gray-400">{label}</p>
      </div>
    </div>
  )
}

// ─── Step card (ClassementV2 card + gradient header) ────────────────────────────

function StepCard({ step, title, icon, children }: { step: string; title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-white/70 bg-white shadow-[0_8px_28px_rgba(20,30,60,0.08),0_1px_3px_rgba(20,30,60,0.06)]">
      <div className="flex items-center gap-4 border-b border-gray-100 bg-gradient-to-r from-[#f7f9fc] to-white px-6 py-[18px]">
        <span className="font-condensed flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0a3f9e] to-brand-navy text-[18px] font-800 text-white shadow-[0_4px_12px_rgba(0,48,135,0.28)]">{step}</span>
        <span className="text-brand-navy">{icon}</span>
        <span className="font-condensed text-[18px] font-700 uppercase tracking-[0.04em] text-gray-900">{title}</span>
      </div>
      <div className="px-6 py-6 text-[15px] leading-relaxed text-gray-600">{children}</div>
    </div>
  )
}

// ─── Sidebar widget (identical to ClassementV2) ─────────────────────────────────

function Widget({ title, icon, accent = 'navy', children }: { title: string; icon?: ReactNode; accent?: 'navy' | 'red'; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-white/70 bg-white shadow-[0_8px_28px_rgba(20,30,60,0.08),0_1px_3px_rgba(20,30,60,0.06)]">
      <div className={`flex items-center gap-2.5 border-b px-6 py-[18px] ${accent === 'red' ? 'border-red-100/70 bg-gradient-to-r from-[#fff5f6] to-white' : 'border-gray-100 bg-gradient-to-r from-[#f7f9fc] to-white'}`}>
        {icon}
        <span className={`font-condensed text-[18px] font-700 uppercase tracking-[0.04em] ${accent === 'red' ? 'text-brand-red' : 'text-gray-900'}`}>{title}</span>
      </div>
      {children}
    </div>
  )
}

const POINTS: { label: string; pts: string; highlight?: boolean }[] = [
  { label: 'Équipe qualifiée des groupes (top 2)', pts: '2' },
  { label: "Vainqueur d'un seizième de finale", pts: '2' },
  { label: "Vainqueur d'un huitième de finale", pts: '5' },
  { label: "Vainqueur d'un quart de finale", pts: '10' },
  { label: "Vainqueur d'une demi-finale", pts: '15' },
  { label: 'Bonne prédiction pour la 3e place', pts: '10' },
  { label: 'Champion du monde', pts: '25', highlight: true },
]

const TIPS = [
  'Pour chaque groupe, clique 3 fois pour sélectionner le 1er, 2e et 3e.',
  "Va ensuite dans l'onglet Meilleurs 3es et coche exactement 8 groupes.",
  "N'oublie pas de cliquer Enregistrer en bas de la page Bracket.",
  'Le site fonctionne sur téléphone, tablette et ordinateur.',
  'En cas de problème, essaie le mode navigation privée de ton navigateur.',
]

// ════════════════════════════════════════════════════════════════════════════
//  Page
// ════════════════════════════════════════════════════════════════════════════

export default function AidePage() {
  const days = daysUntil(T_START)

  return (
    <div className="min-h-full w-full px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-[1280px]">

        {/* ── HEADER CARD ─────────────────────────────────────────────── */}
        <div className="relative flex flex-col gap-8 overflow-hidden rounded-[28px] border border-white/60 bg-gradient-to-br from-white via-white to-[#eef3fb] px-7 py-8 shadow-[0_14px_44px_rgba(20,30,60,0.10),0_2px_6px_rgba(20,30,60,0.05)] md:px-11 md:py-11 lg:flex-row lg:items-center lg:justify-between" style={{ zoom: 0.8 }}>
          {/* decorative trophy glow */}
          <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(245,166,35,0.16)_0%,transparent_70%)]" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(0,48,135,0.07)_0%,transparent_70%)]" />
          <div className="relative min-w-0">
            <p className="mb-2 inline-flex items-center gap-2 text-[14px] font-700 uppercase tracking-[0.24em] text-brand-navy">
              <Trophy size={16} className="text-brand-gold" /> FIFA World Cup 2026
            </p>
            <h1 className="font-condensed bg-gradient-to-br from-gray-900 to-[#1f3a6e] bg-clip-text text-[46px] font-800 uppercase leading-[0.9] tracking-[0.01em] text-transparent sm:text-[64px] md:text-[76px]">Comment jouer ?</h1>
            <p className="mt-3 max-w-lg text-[16px] leading-relaxed text-gray-500">
              Tout ce qu'il faut savoir pour participer au pronostic familial de la Coupe du Monde 2026.
            </p>
          </div>
          <div className="relative flex shrink-0 flex-wrap divide-x divide-gray-200/70 rounded-[20px] border border-white/80 bg-white/70 py-3 shadow-[0_8px_24px_rgba(20,30,60,0.07)] backdrop-blur">
            <Stat icon={<Layers size={24} strokeWidth={2} />} value={12} label="groupes" />
            <Stat icon={<Star size={24} strokeWidth={2} />} value={8} label="meilleurs 3es" />
            <Stat icon={<Trophy size={24} strokeWidth={2} />} value={225} label="points max" gold />
            <Stat icon={<CalendarDays size={24} strokeWidth={2} />} value={days === 0 ? 'Auj.' : days} label={days === 0 ? 'jour J' : `jour${days > 1 ? 's' : ''} restants`} />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">

          {/* ── MAIN: STEPS ──────────────────────────────────────────── */}
          <div className="flex min-w-0 flex-1 flex-col gap-6">

            <StepCard step="01" title="Se connecter" icon={<LogIn size={20} strokeWidth={2} />}>
              <div className="space-y-3">
                <p>Sur la page d'accueil, entre ton <strong className="text-gray-900">prénom</strong> et le <strong className="text-gray-900">code de la famille</strong>.</p>
                <p>Tes pronostics sont sauvegardés automatiquement — tu peux revenir depuis n'importe quel appareil à tout moment.</p>
                <div className="rounded-xl border-l-2 border-brand-navy bg-[#f4f6fa] px-4 py-3 text-[14px] text-gray-500">
                  Tu ne connais pas le code ? Demande à Danny.
                </div>
              </div>
            </StepCard>

            <StepCard step="02" title="Phase de groupes" icon={<Target size={20} strokeWidth={2} />}>
              <div className="space-y-4">
                <p>Dans l'onglet <strong className="text-gray-900">Bracket</strong>, pour chacun des 12 groupes (A à L), tu dois sélectionner les <strong className="text-gray-900">3 premières équipes</strong> dans l'ordre.</p>
                <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100">
                  {[
                    "Clique sur l'équipe qui finira 1re — elle s'affiche en bleu marine",
                    "Clique sur l'équipe qui finira 2e",
                    "Clique sur l'équipe qui finira 3e — servira à l'étape suivante",
                  ].map((txt, i) => (
                    <div key={i} className="flex items-start gap-4 px-4 py-3">
                      <span className="font-condensed mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-brand-navy text-[12px] font-800 text-white">{i + 1}</span>
                      <span className="text-[14px]">{txt}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[14px] text-gray-400">Tu peux modifier tes choix à tout moment en cliquant à nouveau sur les équipes.</p>
              </div>
            </StepCard>

            <StepCard step="03" title="Meilleurs 3es" icon={<Star size={20} strokeWidth={2} />}>
              <div className="space-y-3">
                <p>La Coupe du Monde 2026 a une règle spéciale : les <strong className="text-gray-900">8 meilleures équipes 3es</strong> (sur 12) se qualifient aussi pour les seizièmes de finale.</p>
                <p>Dans l'onglet <strong className="text-gray-900">Meilleurs 3es</strong>, coche les 8 groupes dont tu penses que la 3e équipe mérite de passer.</p>
                <div className="rounded-xl border-l-2 border-brand-navy bg-[#f4f6fa] px-4 py-3 text-[14px] text-gray-500">
                  Tu dois d'abord sélectionner un 3e dans chaque groupe pour activer ce choix.
                </div>
              </div>
            </StepCard>

            <StepCard step="04" title="Phase éliminatoire" icon={<ListChecks size={20} strokeWidth={2} />}>
              <div className="space-y-4">
                <p>Une fois les groupes et les meilleurs 3es choisis, les matchs éliminatoires s'affichent. Clique sur l'équipe que tu penses gagnante à chaque tour.</p>
                <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100">
                  {[
                    { label: 'Seizièmes de finale', detail: '16 matchs' },
                    { label: 'Huitièmes de finale', detail: '8 matchs' },
                    { label: 'Quarts de finale', detail: '4 matchs' },
                    { label: 'Demi-finales', detail: '2 matchs' },
                    { label: 'Finale + 3e place', detail: 'Choisis ton champion' },
                  ].map(({ label, detail }) => (
                    <div key={label} className="flex items-center justify-between px-4 py-3">
                      <span className="font-600 text-gray-900">{label}</span>
                      <span className="text-[13px] text-gray-400">{detail}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border-l-2 border-brand-gold bg-[#fff8e6] px-4 py-3 text-[14px] text-[#92400e]">
                  <strong>Important :</strong> tes pronostics sont modifiables jusqu'au coup d'envoi du premier match (11 juin 2026). Après, ils sont figés.
                </div>
              </div>
            </StepCard>

            <StepCard step="05" title="Calcul des points" icon={<Crown size={20} strokeWidth={2} />}>
              <p>Tu gagnes des points pour chaque bonne prédiction. Plus le tour est avancé, plus ça rapporte. Le détail complet du barème est dans l'encadré à droite — un sans-faute vaut <strong className="text-gray-900">225 points</strong>.</p>
            </StepCard>

            <StepCard step="06" title="Suivre les scores" icon={<Eye size={20} strokeWidth={2} />}>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <span className="w-28 flex-shrink-0 text-[12px] font-700 uppercase tracking-wide text-brand-navy">Classement</span>
                  <span className="text-[14px]">Les scores de tout le monde en temps réel. Clique sur un nom pour voir ses pronostics en détail.</span>
                </div>
                <div className="flex gap-4">
                  <span className="w-28 flex-shrink-0 text-[12px] font-700 uppercase tracking-wide text-brand-navy">Mon profil</span>
                  <span className="text-[14px]">Un résumé de tous tes propres pronostics sur une seule page.</span>
                </div>
              </div>
            </StepCard>
          </div>

          {/* ── SIDEBAR ──────────────────────────────────────────────── */}
          <aside className="flex w-full flex-shrink-0 flex-col gap-6 lg:sticky lg:top-6 lg:w-[384px]">

            <Widget title="Barème des points" icon={<Trophy size={22} className="text-brand-gold" />}>
              <div className="divide-y divide-gray-50">
                {POINTS.map(({ label, pts, highlight }) => (
                  <div key={label} className={`flex items-center justify-between gap-3 px-6 py-[14px] ${highlight ? 'bg-[#fffdf3]' : ''}`}>
                    <span className={`text-[15px] ${highlight ? 'font-700 text-gray-900' : 'text-gray-600'}`}>{label}</span>
                    <span className={`font-condensed flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-[20px] font-800 ${highlight ? 'bg-brand-red text-white' : 'bg-[#f4f6fa] text-brand-navy'}`}>{pts}</span>
                  </div>
                ))}
              </div>
            </Widget>

            <Widget title="À savoir" icon={<Lightbulb size={22} className="text-brand-red" />} accent="red">
              <div className="space-y-3 p-6">
                {TIPS.map(tip => (
                  <div key={tip} className="flex items-start gap-3 text-[14px] leading-relaxed text-gray-600">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-gold" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </Widget>

          </aside>
        </div>
      </div>
    </div>
  )
}
