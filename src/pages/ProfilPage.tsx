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
  const [tab, setTab] = useState<'groupes' | 'eliminatoire'>('groupes')

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
    <div className="max-w-3xl mx-auto">

      {/* Hero band */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 md:px-6 py-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#003087] flex items-center justify-center shrink-0">
              <span className="font-display text-[22px] font-700 text-white uppercase">{player?.pseudo?.[0]}</span>
            </div>
            <div>
              <h1 className="font-display text-[32px] font-800 text-[#003087] tracking-tight leading-none">
                {player?.pseudo}
              </h1>
              <p className="text-[13px] text-gray-400 mt-2 font-medium">Mon profil</p>
            </div>
          </div>

          {/* Score chip */}
          {hasResults && breakdown && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Score total</p>
                <p className="font-condensed text-[36px] font-800 text-[#c8102e] leading-none">{breakdown.total}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">/ 193 pts</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 md:px-6 py-8 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-5 h-5 border-2 border-[#003087] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !bracket ? (
          <div className="bg-white border border-gray-200 shadow-sm px-6 py-16 text-center">
            <div className="text-4xl mb-4">📋</div>
            <p className="font-condensed text-[20px] font-700 uppercase text-[#003087] tracking-wide">Bracket non soumis</p>
            <p className="text-[13px] text-gray-500 mt-2">Remplis ton bracket dans la section Bracket.</p>
          </div>
        ) : (
          <>
            {/* Score detail + champion */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hasResults && breakdown ? (
                <div className="bg-white border border-gray-200 shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Détail du score</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {[
                      { label: 'Phase de groupes', val: breakdown.groups, max: 48 },
                      { label: '1/8 de finale', val: breakdown.r16, max: 40 },
                      { label: 'Quarts de finale', val: breakdown.quarters, max: 40 },
                      { label: 'Demi-finales', val: breakdown.semis, max: 30 },
                      { label: 'Finale', val: breakdown.final, max: 25 },
                      { label: '3e place', val: breakdown.thirdPlace, max: 10 },
                    ].map(({ label, val, max }) => (
                      <div key={label} className="flex items-center px-4 py-2.5 gap-3">
                        <span className="flex-1 text-[12px] text-gray-600">{label}</span>
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#003087] rounded-full" style={{ width: `${Math.round((val / max) * 100)}%` }} />
                        </div>
                        <span className="text-[13px] font-bold text-[#003087] w-8 text-right">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-dashed border-gray-200 px-4 py-8 text-center flex flex-col items-center justify-center">
                  <span className="text-3xl mb-2">⏳</span>
                  <p className="text-[12px] text-gray-400 max-w-[180px]">Score disponible après la saisie des résultats officiels</p>
                </div>
              )}

              {champion && (
                <div className="bg-white border-2 border-[#f5a623] shadow-sm flex flex-col items-center justify-center px-6 py-8 gap-3">
                  <span className="text-5xl">{champion.flag}</span>
                  <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Mon champion 2026</p>
                    <p className="font-condensed text-[24px] font-700 uppercase text-[#111827] tracking-wide">{champion.name}</p>
                  </div>
                  <span className="text-4xl">🏆</span>
                </div>
              )}
            </div>

            {/* Bracket summary tabs */}
            <div className="bg-white border border-gray-200 shadow-sm">
              <div className="flex border-b border-gray-200">
                {([{ id: 'groupes', label: 'Groupes' }, { id: 'eliminatoire', label: 'Phase éliminatoire' }] as const).map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`relative px-5 py-3 text-[12px] font-semibold uppercase tracking-wider transition-colors
                      ${tab === t.id ? 'text-[#003087]' : 'text-gray-400 hover:text-gray-700'}`}
                  >
                    {t.label}
                    {tab === t.id && <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#003087]" />}
                  </button>
                ))}
              </div>

              {tab === 'groupes' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-gray-100">
                  {GROUPS.map(g => {
                    const [i1, i2] = bracket.groupQualified[g] as [number, number]
                    const t1 = GROUP_TEAMS[g][i1]
                    const t2 = GROUP_TEAMS[g][i2]
                    return (
                      <div key={g} className="px-4 py-3">
                        <p className="font-condensed text-[11px] font-600 uppercase tracking-widest text-[#003087] mb-2">Groupe {g}</p>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[12px]">
                            <span className="text-[10px] font-bold text-[#003087] w-3 shrink-0">1</span>
                            <span className="shrink-0">{t1.flag}</span>
                            <span className="truncate text-gray-900 font-semibold">{t1.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[12px]">
                            <span className="text-[10px] font-medium text-gray-400 w-3 shrink-0">2</span>
                            <span className="shrink-0">{t2.flag}</span>
                            <span className="truncate text-gray-500">{t2.name}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {tab === 'eliminatoire' && (
                <div className="divide-y divide-gray-100">
                  <SectionLines title="1/8 de finale">
                    {EIGHTFINALS.map((m, i) => {
                      const t1 = getGroupTeam(bracket, m.t1.g, m.t1.rank as 1 | 2)
                      const t2 = getGroupTeam(bracket, m.t2.g, m.t2.rank as 1 | 2)
                      const w = bracket.r16[i]
                      return <MatchLine key={i} label={`M${i + 1}`} t1={t1} t2={t2} winner={w === 0 ? t1 : w === 1 ? t2 : null} />
                    })}
                  </SectionLines>
                  <SectionLines title="Quarts de finale">
                    {Array.from({ length: 4 }, (_, i) => {
                      const t1 = getQuarterTeam(bracket, i, 0)
                      const t2 = getQuarterTeam(bracket, i, 1)
                      const w = bracket.quarters[i]
                      return <MatchLine key={i} label={`Q${i + 1}`} t1={t1} t2={t2} winner={w === 0 ? t1 : w === 1 ? t2 : null} />
                    })}
                  </SectionLines>
                  <SectionLines title="Demi-finales">
                    {Array.from({ length: 2 }, (_, i) => {
                      const t1 = getSemiTeam(bracket, i, 0)
                      const t2 = getSemiTeam(bracket, i, 1)
                      const w = bracket.semis[i]
                      return <MatchLine key={i} label={`D${i + 1}`} t1={t1} t2={t2} winner={w === 0 ? t1 : w === 1 ? t2 : null} />
                    })}
                  </SectionLines>
                  <SectionLines title="Finale">
                    {(() => {
                      const t1 = getFinalTeam(bracket, 0)
                      const t2 = getFinalTeam(bracket, 1)
                      const w = bracket.final
                      return <MatchLine label="Finale" t1={t1} t2={t2} winner={w === 0 ? t1 : w === 1 ? t2 : null} />
                    })()}
                  </SectionLines>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SectionLines({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#003087]">{title}</p>
      </div>
      {children}
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
    <div className="flex items-center px-4 py-2.5 gap-3 text-[12px] border-b border-gray-50 last:border-0">
      <span className="text-[10px] text-gray-400 font-semibold uppercase w-10 shrink-0">{label}</span>
      <span className={`flex-1 truncate font-medium ${winner && t1 && winner.name === t1.name ? 'text-[#003087] font-bold' : 'text-gray-400'}`}>
        {t1 ? `${t1.flag} ${t1.name}` : '—'}
      </span>
      <span className="text-[10px] text-gray-300 shrink-0 font-medium">vs</span>
      <span className={`flex-1 truncate text-right font-medium ${winner && t2 && winner.name === t2.name ? 'text-[#003087] font-bold' : 'text-gray-400'}`}>
        {t2 ? `${t2.flag} ${t2.name}` : '—'}
      </span>
      <span className="text-[#003087] font-bold shrink-0 w-4 text-right text-[11px]">
        {winner ? '✓' : ''}
      </span>
    </div>
  )
}
