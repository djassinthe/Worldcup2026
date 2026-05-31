export default function AidePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-condensed text-[32px] font-800 uppercase tracking-wide text-[#003087] leading-none mb-2">
          Comment jouer ?
        </h1>
        <p className="text-[15px] text-gray-500">
          Tout ce qu'il faut savoir pour participer au pronostic familial de la Coupe du Monde 2026.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-4">

        {/* Step 1 */}
        <div className="bg-white border border-[#e1e4e8] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#003087] px-5 py-3 flex items-center gap-3">
            <span className="text-2xl">🔑</span>
            <span className="font-condensed text-[17px] font-700 uppercase tracking-widest text-white">
              Étape 1 — Se connecter
            </span>
          </div>
          <div className="px-5 py-4 space-y-2 text-[14px] text-gray-700 leading-relaxed">
            <p>Sur la page d'accueil, entre ton <strong>prénom</strong> et le <strong>code de la famille</strong>.</p>
            <p>Tu retrouveras tes pronostics à chaque fois que tu reviens sur le site, depuis n'importe quel appareil.</p>
            <div className="mt-3 bg-[#f0f2f5] rounded-lg px-4 py-3 text-[13px] text-gray-500">
              💬 Tu ne connais pas le code ? Demande à Danny.
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white border border-[#e1e4e8] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#003087] px-5 py-3 flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <span className="font-condensed text-[17px] font-700 uppercase tracking-widest text-white">
              Étape 2 — Remplir son bracket
            </span>
          </div>
          <div className="px-5 py-4 space-y-4 text-[14px] text-gray-700 leading-relaxed">
            <p>Va dans l'onglet <strong>Bracket</strong>. C'est ici que tu fais toutes tes prédictions.</p>

            <div className="border border-[#e1e4e8] rounded-lg overflow-hidden">
              <div className="bg-[#f0f2f5] px-4 py-2 text-[12px] font-bold uppercase tracking-widest text-[#003087]">
                Phase de groupes
              </div>
              <div className="px-4 py-3 space-y-2">
                <p>Pour chaque groupe (A à L), tu dois choisir <strong>2 équipes qualifiées</strong> :</p>
                <ol className="list-decimal list-inside space-y-1 pl-1">
                  <li>Clique sur l'équipe qui finira <strong>1ère</strong> du groupe → elle s'affiche en bleu</li>
                  <li>Clique sur l'équipe qui finira <strong>2ème</strong> → les deux sont confirmées ✓</li>
                </ol>
                <p className="text-gray-500 text-[13px]">Tu peux changer d'avis en cliquant à nouveau.</p>
              </div>
            </div>

            <div className="border border-[#e1e4e8] rounded-lg overflow-hidden">
              <div className="bg-[#f0f2f5] px-4 py-2 text-[12px] font-bold uppercase tracking-widest text-[#003087]">
                Phase éliminatoire
              </div>
              <div className="px-4 py-3 space-y-2">
                <p>Une fois les groupes remplis, les matchs éliminatoires apparaissent en dessous :</p>
                <ul className="space-y-1 pl-1">
                  <li>⚽ <strong>1/8 de finale</strong> — 16 matchs</li>
                  <li>⚽ <strong>Quarts de finale</strong> — 8 matchs</li>
                  <li>⚽ <strong>Demi-finales</strong> — 4 matchs</li>
                  <li>⚽ <strong>Finale</strong> — choisis ton champion !</li>
                </ul>
                <p>Pour chaque match, clique sur l'équipe que tu penses gagnante.</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-[13px] text-amber-800">
              ⏰ <strong>Important :</strong> tu peux modifier tes pronostics jusqu'au début du tournoi. Après le coup d'envoi du 1er match, les prédictions sont figées.
            </div>
          </div>
        </div>

        {/* Step 3 - Scoring */}
        <div className="bg-white border border-[#e1e4e8] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#003087] px-5 py-3 flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <span className="font-condensed text-[17px] font-700 uppercase tracking-widest text-white">
              Étape 3 — Les points
            </span>
          </div>
          <div className="px-5 py-4 text-[14px] text-gray-700">
            <p className="mb-4">Tu gagnes des points à chaque bonne prédiction. Plus le match est tardif dans le tournoi, plus ça rapporte !</p>
            <div className="space-y-2">
              {[
                { label: 'Équipe qualifiée de la phase de groupes', pts: '1 pt' },
                { label: 'Équipe qualifiée en quarts de finale (1/8)', pts: '2 pts' },
                { label: 'Équipe qualifiée en demi-finales (quarts)', pts: '4 pts' },
                { label: 'Équipe qualifiée en finale (demi)', pts: '8 pts' },
                { label: 'Champion du monde ✓', pts: '16 pts' },
              ].map(({ label, pts }) => (
                <div key={label} className="flex items-center justify-between gap-3 py-2 border-b border-[#f0f2f5] last:border-0">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-bold text-[#003087] shrink-0">{pts}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step 4 - Classement */}
        <div className="bg-white border border-[#e1e4e8] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#003087] px-5 py-3 flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <span className="font-condensed text-[17px] font-700 uppercase tracking-widest text-white">
              Suivre les scores
            </span>
          </div>
          <div className="px-5 py-4 space-y-3 text-[14px] text-gray-700 leading-relaxed">
            <div className="flex gap-3">
              <span className="shrink-0 w-24 font-semibold text-[#003087]">Classement</span>
              <span>Vois le score de tout le monde en temps réel, et clique sur un nom pour voir ses pronostics détaillés.</span>
            </div>
            <div className="flex gap-3">
              <span className="shrink-0 w-24 font-semibold text-[#003087]">Mon profil</span>
              <span>Retrouve tous tes propres pronostics résumés sur une seule page.</span>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-[#003087] rounded-xl px-5 py-5 text-white">
          <p className="font-condensed text-[17px] font-700 uppercase tracking-widest mb-3">Conseils</p>
          <ul className="space-y-2 text-[14px] text-white/80 leading-relaxed">
            <li>✅ Remplis tous les groupes <strong className="text-white">avant</strong> de passer aux matchs éliminatoires</li>
            <li>✅ N'oublie pas de cliquer <strong className="text-white">Enregistrer</strong> en bas de la page Bracket</li>
            <li>✅ Le site marche sur téléphone, tablette et ordinateur</li>
            <li>✅ En cas de problème, passe en mode navigation privée et recharge la page</li>
          </ul>
        </div>

      </div>
    </div>
  )
}
