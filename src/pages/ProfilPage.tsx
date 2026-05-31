import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  type BracketData,
  DEFAULT_DATA,
  GROUP_TEAMS,
  GROUPS,
  EIGHTFINALS,
  getChampion,
  getGroupTeam,
  getQuarterTeam,
  getSemiTeam,
  getFinalTeam,
} from '../utils/bracketData'
import { calculateScore, type ScoreBreakdown } from '../utils/scoreUtils'

export default function ProfilPage() {
  const { player } = useAuth()
  const [bracket, setBracket] = useState<BracketData | null>(null)
  const [breakdown, setBreakdown] = useState<ScoreBreakdown | null>(null)
  const [hasResults, setHasResults] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'resume' | 'detail'>('resume')

  useEffect(() => {
    async function load() {
      if (!player) return
      const [predRes, resultsRes] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('bracket_predictions').select('data').eq('player_id', player.id).maybeSingle(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('tournament_results').select('data').limit(1).maybeSingle(),
      ])
      const pred: BracketData | null = predRes.data?.data ?? null
      const real: BracketData = { ...DEFAULT_DATA, ...(resultsRes.data?.data ?? {}) }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyResults = real.r16.some((x: any) => x !== null) ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.values(real.groupQualified).some((q: any) => q[0] !== 0 || q[1] !== 1)
      setHasResults(anyResults)
      if (pred) {
        setBracket(pred)
        if (anyResults) setBreakdown(calculateScore(pred, real))
      }
      setLoading(false)
    }
    load()
  }, [player])

  const champion = bracket ? getChampion(bracket) : null

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="px-4 md:px-6 pt-6 pb-4 flex items-center gap-3">
        <span className="w-10 h-10 flex items-center justify-center text-[15px] font-bold uppercase bg-[#1a73e8] dark:bg-[#8ab4f8] text-white dark:text-[#202124]">
          {player?.pseudo?.[0]}
        </span>
        <div>
          <h1 className="text-[22px] font-normal text-gray-900 dark:text-[#e8eaed] leading-tight">{player?.pseudo}</h1>
          <p className="text-[13px] text-[#5f6368] dark:text-[#9aa0a6]">Mon profil</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-5 h-5 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !bracket ? (
        <div className="px-4 md:px-6 py-16 text-center">
          <p className="text-[15px] text-gray-900 dark:text-[#e8eaed] font-medium">Bracket non soumis</p>
          <p className="text-[13px] text-[#5f6368] dark:text-[#9aa0a6] mt-2">
            Remplis ton bracket dans la section Phase éliminatoire.
          </p>
        </div>
      ) : (
        <div className="px-4 md:px-6 pb-8 space-y-6">

          {/* Score actuel */}
          {hasResults && breakdown ? (
            <div className="border border-gray-200 dark:border-[#3c4043]">
              <div className="px-4 py-2 bg-gray-50 dark:bg-[#292a2d] border-b border-gray-200 dark:border-[#3c4043]">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[#5f6368] dark:text-[#9aa0a6]">Score actuel</span>
              </div>
              <div className="px-4 py-4 flex items-center justify-between">
                <div>
                  <p className="text-[40px] font-bold text-[#1a73e8] dark:text-[#8ab4f8] leading-none">{breakdown.total}</p>
                  <p className="text-[12px] text-[#5f6368] dark:text-[#9aa0a6] mt-1">pts sur 193 max</p>
                </div>
                <div className="text-right space-y-1">
                  {[
                    { label: 'Groupes', val: breakdown.groups },
                    { label: '1/8 de finale', val: breakdown.r16 },
                    { label: 'Quarts', val: breakdown.quarters },
                    { label: 'Demi-finales', val: breakdown.semis },
                    { label: 'Finale', val: breakdown.final },
                    { label: '3e place', val: breakdown.thirdPlace },
                  ].map(({ label, val }) => (
                    <p key={label} className="text-[12px] text-[#5f6368] dark:text-[#9aa0a6]">
                      {label} : <span className="font-semibold text-gray-900 dark:text-[#e8eaed]">{val}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-gray-200 dark:border-[#3c4043] px-4 py-3 text-[13px] text-[#5f6368] dark:text-[#9aa0a6]">
              Le score sera calculé une fois les résultats officiels saisis par l'administrateur.
            </div>
          )}

          {/* Champion prédit */}
          {champion && (
            <div className="border-l-[3px] border-[#1a73e8] dark:border-[#8ab4f8] pl-4 py-1">
              <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide font-medium mb-1">Champion prédit</p>
              <p className="text-[20px] font-medium text-gray-900 dark:text-[#e8eaed]">{champion.flag} {champion.name}</p>
            </div>
          )}

          {/* Tabs résumé / détail */}
          <div>
            <div className="border-b border-gray-200 dark:border-[#3c4043] flex mb-4">
              {([{ id: 'resume', label: 'Groupes' }, { id: 'detail', label: 'Phase éliminatoire' }] as const).map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`relative px-4 pb-3 pt-1 text-[13px] font-medium whitespace-nowrap transition-colors
                    ${tab === t.id ? 'text-[#1a73e8] dark:text-[#8ab4f8]' : 'text-[#5f6368] dark:text-[#9aa0a6] hover:text-gray-800 dark:hover:text-[#e8eaed]'}`}
                >
                  {t.label}
                  {tab === t.id && <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1a73e8] dark:bg-[#8ab4f8]" />}
                </button>
              ))}
            </div>

            {tab === 'resume' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-gray-200 dark:bg-[#3c4043]">
                {GROUPS.map(g => {
                  const [i1, i2] = bracket.groupQualified[g] as [number, number]
                  const t1 = GROUP_TEAMS[g][i1]
                  const t2 = GROUP_TEAMS[g][i2]
                  return (
                    <div key={g} className="bg-white dark:bg-[#202124] px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#5f6368] dark:text-[#9aa0a6] mb-2">Groupe {g}</p>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[12px]">
                          <span className="text-[10px] font-bold text-[#1a73e8] dark:text-[#8ab4f8] w-3 shrink-0">1</span>
                          <span className="shrink-0">{t1.flag}</span>
                          <span className="truncate text-gray-900 dark:text-[#e8eaed] font-medium">{t1.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[12px]">
                          <span className="text-[10px] font-medium text-[#9aa0a6] w-3 shrink-0">2</span>
                          <span className="shrink-0">{t2.flag}</span>
                          <span className="truncate text-[#5f6368] dark:text-[#9aa0a6]">{t2.name}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {tab === 'detail' && (
              <div className="space-y-5">
                {/* 1/8 */}
                <Section title="1/8 de finale">
                  {EIGHTFINALS.map((m, i) => {
                    const t1 = getGroupTeam(bracket, m.t1.g, m.t1.rank as 1 | 2)
                    const t2 = getGroupTeam(bracket, m.t2.g, m.t2.rank as 1 | 2)
                    const w = bracket.r16[i]
                    const winner = w === 0 ? t1 : w === 1 ? t2 : null
                    return <MatchLine key={i} label={`M${i + 1}`} t1={t1} t2={t2} winner={winner} />
                  })}
                </Section>

                {/* Quarts */}
                <Section title="Quarts de finale">
                  {Array.from({ length: 4 }, (_, i) => {
                    const t1 = getQuarterTeam(bracket, i, 0)
                    const t2 = getQuarterTeam(bracket, i, 1)
                    const w = bracket.quarters[i]
                    const winner = w === 0 ? t1 : w === 1 ? t2 : null
                    return <MatchLine key={i} label={`Q${i + 1}`} t1={t1} t2={t2} winner={winner} />
                  })}
                </Section>

                {/* Demi-finales */}
                <Section title="Demi-finales">
                  {Array.from({ length: 2 }, (_, i) => {
                    const t1 = getSemiTeam(bracket, i, 0)
                    const t2 = getSemiTeam(bracket, i, 1)
                    const w = bracket.semis[i]
                    const winner = w === 0 ? t1 : w === 1 ? t2 : null
                    return <MatchLine key={i} label={`D${i + 1}`} t1={t1} t2={t2} winner={winner} />
                  })}
                </Section>

                {/* Finale */}
                <Section title="Finale">
                  {(() => {
                    const t1 = getFinalTeam(bracket, 0)
                    const t2 = getFinalTeam(bracket, 1)
                    const w = bracket.final
                    const winner = w === 0 ? t1 : w === 1 ? t2 : null
                    return <MatchLine label="Finale" t1={t1} t2={t2} winner={winner} />
                  })()}
                </Section>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-[#5f6368] dark:text-[#9aa0a6] mb-2">{title}</p>
      <div className="border border-gray-200 dark:border-[#3c4043] divide-y divide-gray-200 dark:divide-[#3c4043]">
        {children}
      </div>
    </div>
  )
}

function MatchLine({ label, t1, t2, winner }: {
  label: string
  t1: { name: string; flag: string } | null
  t2: { name: string; flag: string } | null
  winner: { name: string; flag: string } | null
}) {
  return (
    <div className="flex items-center px-3 py-2 gap-3 text-[12px]">
      <span className="text-[10px] text-[#9aa0a6] font-medium w-10 shrink-0">{label}</span>
      <span className={`flex-1 truncate ${winner && t1 && winner.name === t1.name ? 'font-semibold text-gray-900 dark:text-[#e8eaed]' : 'text-[#9aa0a6]'}`}>
        {t1 ? `${t1.flag} ${t1.name}` : '—'}
      </span>
      <span className="text-[10px] text-[#9aa0a6] shrink-0">vs</span>
      <span className={`flex-1 truncate text-right ${winner && t2 && winner.name === t2.name ? 'font-semibold text-gray-900 dark:text-[#e8eaed]' : 'text-[#9aa0a6]'}`}>
        {t2 ? `${t2.flag} ${t2.name}` : '—'}
      </span>
      <span className="text-[11px] shrink-0 w-5 text-right">
        {winner ? '✓' : ''}
      </span>
    </div>
  )
}
