function SectionHeader({ step, title }: { step: string; title: string }) {
  return (
    <div className="bg-[#003087] px-5 py-3 flex items-center gap-4">
      <span className="font-condensed text-[11px] font-700 tracking-[0.2em] uppercase text-[#f5a623]">{step}</span>
      <span className="w-px h-4 bg-white/20" />
      <span className="font-condensed text-[15px] font-700 uppercase tracking-widest text-white">{title}</span>
    </div>
  )
}

export default function AidePage() {
  return (
    <div className="max-w-2xl mx-auto pb-24 md:pb-8">

      {/* Page hero — same style as ProfilPage */}
      <div className="bg-white border-b border-[#e1e4e8] shadow-sm">
        <div className="py-8" style={{ paddingLeft: '24px', paddingRight: '24px' }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Guide</p>
          <h1 className="font-condensed text-[36px] font-800 uppercase tracking-wide text-[#003087] leading-none">
            Comment jouer ?
          </h1>
          <p className="text-[14px] text-gray-500 mt-2 leading-relaxed">
            Tout ce qu'il faut savoir pour participer au pronostic familial de la Coupe du Monde 2026.
          </p>
        </div>
      </div>

      <div className="py-6 space-y-4" style={{ paddingLeft: '24px', paddingRight: '24px' }}>

        {/* Step 1 — Se connecter */}
        <div className="bg-white border border-[#e1e4e8] shadow-sm overflow-hidden">
          <SectionHeader step="01" title="Se connecter" />
          <div className="px-5 py-5 space-y-3 text-[14px] text-[#374151] leading-relaxed">
            <p>Sur la page d'accueil, entre ton <strong className="text-[#111827]">prénom</strong> et le <strong className="text-[#111827]">code de la famille</strong>.</p>
            <p>Tes pronostics sont sauvegardés automatiquement — tu peux revenir depuis n'importe quel appareil à tout moment.</p>
            <div className="bg-[#f0f2f5] border-l-2 border-[#003087] px-4 py-3 text-[13px] text-[#6b7280]">
              Tu ne connais pas le code ? Demande à Danny.
            </div>
          </div>
        </div>

        {/* Step 2 — Phase de groupes */}
        <div className="bg-white border border-[#e1e4e8] shadow-sm overflow-hidden">
          <SectionHeader step="02" title="Phase de groupes" />
          <div className="px-5 py-5 space-y-4 text-[14px] text-[#374151] leading-relaxed">
            <p>Dans l'onglet <strong className="text-[#111827]">Bracket</strong>, tu dois choisir les <strong className="text-[#111827]">2 équipes qualifiées</strong> de chacun des 12 groupes (A à L).</p>
            <div className="space-y-0 border border-[#e1e4e8]">
              <div className="flex items-start gap-4 px-4 py-3 border-b border-[#e1e4e8]">
                <span className="shrink-0 w-6 h-6 bg-[#003087] text-white text-[11px] font-bold flex items-center justify-center mt-0.5">1</span>
                <span>Clique sur l'équipe qui finira <strong className="text-[#111827]">1re</strong> — elle s'affiche en bleu marine</span>
              </div>
              <div className="flex items-start gap-4 px-4 py-3">
                <span className="shrink-0 w-6 h-6 bg-[#003087] text-white text-[11px] font-bold flex items-center justify-center mt-0.5">2</span>
                <span>Clique sur l'équipe qui finira <strong className="text-[#111827]">2e</strong> — les deux sont confirmées</span>
              </div>
            </div>
            <p className="text-[13px] text-[#6b7280]">Tu peux modifier tes choix à tout moment en cliquant à nouveau.</p>
          </div>
        </div>

        {/* Step 3 — Phase éliminatoire */}
        <div className="bg-white border border-[#e1e4e8] shadow-sm overflow-hidden">
          <SectionHeader step="03" title="Phase éliminatoire" />
          <div className="px-5 py-5 space-y-4 text-[14px] text-[#374151] leading-relaxed">
            <p>Une fois les groupes remplis, les matchs éliminatoires s'affichent automatiquement. Clique sur l'équipe que tu penses gagnante à chaque tour.</p>
            <div className="space-y-0 border border-[#e1e4e8]">
              {[
                { label: 'Seizièmes de finale', detail: '16 matchs — 1ers, 2es et meilleurs 3es' },
                { label: 'Huitièmes de finale', detail: '8 matchs' },
                { label: 'Quarts de finale', detail: '8 matchs' },
                { label: 'Demi-finales', detail: '4 matchs' },
                { label: 'Finale', detail: 'Choisis ton champion' },
              ].map(({ label, detail }, i, arr) => (
                <div key={label} className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? 'border-b border-[#e1e4e8]' : ''}`}>
                  <span className="font-semibold text-[#111827]">{label}</span>
                  <span className="text-[13px] text-[#6b7280]">{detail}</span>
                </div>
              ))}
            </div>
            <div className="bg-[#fff8e6] border-l-2 border-[#f5a623] px-4 py-3 text-[13px] text-[#92400e]">
              <strong>Important :</strong> tes pronostics sont modifiables jusqu'au coup d'envoi du premier match. Après, ils sont figés.
            </div>
          </div>
        </div>

        {/* Step 4 — Points */}
        <div className="bg-white border border-[#e1e4e8] shadow-sm overflow-hidden">
          <SectionHeader step="04" title="Comment les points sont calculés" />
          <div className="px-5 py-5 text-[14px] text-[#374151]">
            <p className="mb-4 leading-relaxed">Tu gagnes des points pour chaque bonne prédiction. Plus le tour est avancé, plus ça rapporte.</p>
            <div className="border border-[#e1e4e8]">
              {[
                { label: 'Équipe qualifiée des groupes (top 2)', pts: '2 pts', highlight: false },
                { label: 'Vainqueur d\'un seizième de finale', pts: '2 pts', highlight: false },
                { label: 'Vainqueur d\'un huitième de finale', pts: '5 pts', highlight: false },
                { label: 'Vainqueur d\'un quart de finale', pts: '10 pts', highlight: false },
                { label: 'Vainqueur d\'une demi-finale', pts: '15 pts', highlight: false },
                { label: 'Champion du monde', pts: '25 pts', highlight: true },
                { label: 'Bonne prédiction pour la 3e place', pts: '10 pts', highlight: false },
              ].map(({ label, pts, highlight }, i, arr) => (
                <div
                  key={label}
                  className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? 'border-b border-[#e1e4e8]' : ''} ${highlight ? 'bg-[#f0f2f5]' : ''}`}
                >
                  <span className={highlight ? 'font-semibold text-[#111827]' : 'text-[#374151]'}>{label}</span>
                  <span className={`font-bold shrink-0 ${highlight ? 'text-[#c8102e] text-[16px]' : 'text-[#003087]'}`}>{pts}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step 5 — Suivre */}
        <div className="bg-white border border-[#e1e4e8] shadow-sm overflow-hidden">
          <SectionHeader step="05" title="Suivre les scores" />
          <div className="px-5 py-5 space-y-0 border-t-0">
            <div className="flex gap-4 py-3 border-b border-[#e1e4e8] text-[14px]">
              <span className="shrink-0 w-28 font-semibold text-[#003087] uppercase tracking-wide text-[12px]">Classement</span>
              <span className="text-[#374151] leading-relaxed">Les scores de tout le monde en temps réel. Clique sur un nom pour voir ses pronostics en détail.</span>
            </div>
            <div className="flex gap-4 py-3 text-[14px]">
              <span className="shrink-0 w-28 font-semibold text-[#003087] uppercase tracking-wide text-[12px]">Mon profil</span>
              <span className="text-[#374151] leading-relaxed">Un résumé de tous tes propres pronostics sur une seule page.</span>
            </div>
          </div>
        </div>

        {/* Tips footer */}
        <div className="bg-[#003087] px-5 py-5">
          <p className="font-condensed text-[13px] font-700 uppercase tracking-[0.2em] text-[#f5a623] mb-4">À savoir</p>
          <div className="space-y-3">
            {[
              'Remplis tous les groupes avant de passer aux matchs éliminatoires.',
              "N'oublie pas de cliquer Enregistrer en bas de la page Bracket.",
              'Le site fonctionne sur téléphone, tablette et ordinateur.',
              'En cas de problème, essaie le mode navigation privée de ton navigateur.',
            ].map((tip) => (
              <div key={tip} className="flex items-start gap-3 text-[14px] text-white/80 leading-relaxed">
                <span className="shrink-0 w-1 h-1 rounded-full bg-[#f5a623] mt-2" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
