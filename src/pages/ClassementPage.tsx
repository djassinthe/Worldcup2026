import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Player } from '../types'
import {
  type BracketData,
  DEFAULT_DATA,
  getChampion,
  GROUPS,
  GROUP_TEAMS,
  getQuarterWinner,
  getThirdPlace,
  getFinalTeam,
} from '../utils/bracketData'
import { calculateScore, type ScoreBreakdown } from '../utils/scoreUtils'

interface RankEntry {
  player_id: string
  pseudo: string
  breakdown: ScoreBreakdown
  champion: { name: string; flag: string } | null
  bracketData: BracketData | null
}

// ─── Player Summary Modal ──────────────────────────────────────────────────────

function PlayerModal({ entry, onClose }: { entry: RankEntry; onClose: () => void }) {
  const data = entry.bracketData
  const champion = data ? getChampion(data) : null
  const finalist0 = data ? getFinalTeam(data, 0) : null
  const finalist1 = data ? getFinalTeam(data, 1) : null
  const semi0 = data ? getQuarterWinner(data, 0) : null
  const semi1 = data ? getQuarterWinner(data, 1) : null
  const semi2 = data ? getQuarterWinner(data, 2) : null
  const semi3 = data ? getQuarterWinner(data, 3) : null
  const third = data ? getThirdPlace(data) : null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white w-full sm:max-w-lg sm:rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#003087] px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Pronostic de</p>
            <p className="font-condensed text-[22px] font-700 uppercase tracking-wide text-white leading-tight">{entry.pseudo}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
          {!data ? (
            <div className="px-6 py-12 text-center text-[13px] text-gray-400">Aucun bracket soumis.</div>
          ) : (
            <>
              {/* Champion */}
              <div className="px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Champion</p>
                {champion ? (
                  <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                    <span className="text-3xl">{champion.flag}</span>
                    <span className="font-condensed text-[20px] font-700 uppercase tracking-wide text-amber-800">{champion.name}</span>
                    <span className="ml-auto text-2xl">🏆</span>
                  </div>
                ) : (
                  <p className="text-[13px] text-gray-400">Non sélectionné</p>
                )}
              </div>

              {/* Finale */}
              <div className="px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Finale</p>
                <div className="grid grid-cols-2 gap-2">
                  {[finalist0, finalist1].map((t, i) => t ? (
                    <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded border ${champion?.name === t.name ? 'bg-[#003087] border-[#003087] text-white' : 'bg-gray-50 border-gray-200 text-[#111827]'}`}>
                      <span>{t.flag}</span>
                      <span className="text-[12px] font-semibold truncate">{t.name}</span>
                    </div>
                  ) : (
                    <div key={i} className="px-3 py-2 rounded border border-dashed border-gray-200 text-[12px] text-gray-300">—</div>
                  ))}
                </div>
                {third && (
                  <p className="text-[12px] text-gray-500 mt-2">
                    <span className="font-semibold text-gray-400">3e place :</span> {third.flag} {third.name}
                  </p>
                )}
              </div>

              {/* Demi-finalistes */}
              <div className="px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Demi-finalistes</p>
                <div className="grid grid-cols-2 gap-2">
                  {[semi0, semi1, semi2, semi3].map((t, i) => t ? (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded">
                      <span>{t.flag}</span>
                      <span className="text-[12px] font-medium text-[#003087] truncate">{t.name}</span>
                    </div>
                  ) : (
                    <div key={i} className="px-3 py-2 rounded border border-dashed border-gray-200 text-[12px] text-gray-300">—</div>
                  ))}
                </div>
              </div>

              {/* Groupes */}
              <div className="px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Qualifiés par groupe</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                  {GROUPS.map(g => {
                    const q = data.groupQualified[g]
                    const teams = GROUP_TEAMS[g]
                    const t1 = teams?.[q?.[0]]
                    const t2 = q?.[1] !== -1 ? teams?.[q?.[1]] : null
                    return (
                      <div key={g}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Gr. {g}</p>
                        <div className="space-y-0.5">
                          {t1 ? <p className="text-[12px] text-[#111827] font-medium">{t1.flag} {t1.name}</p> : <p className="text-[12px] text-gray-300">—</p>}
                          {t2 ? <p className="text-[12px] text-gray-500">{t2.flag} {t2.name}</p> : <p className="text-[12px] text-gray-300">—</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const MEDAL = ['🥇', '🥈', '🥉']
const MEDAL_BG = ['bg-amber-50 border-amber-200', 'bg-gray-50 border-gray-200', 'bg-orange-50 border-orange-200']

export default function ClassementPage() {
  const { player } = useAuth()
  const [entries, setEntries] = useState<RankEntry[]>([])
  const [hasResults, setHasResults] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<RankEntry | null>(null)

  useEffect(() => {
    async function load() {
      const [resultsRes, predsRes, playersRes] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('tournament_results').select('data').limit(1).maybeSingle(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('bracket_predictions').select('player_id, data'),
        supabase.from('players').select('id, pseudo'),
      ])
      const realData: BracketData = { ...DEFAULT_DATA, ...(resultsRes.data?.data ?? {}) }
      const preds: { player_id: string; data: BracketData }[] = predsRes.data ?? []
      const players: Pick<Player, 'id' | 'pseudo'>[] = playersRes.data ?? []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyResults = realData.r16.some((x: any) => x !== null) ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.values(realData.groupQualified).some((q: any) => q[0] !== 0 || q[1] !== 1)
      setHasResults(anyResults)

      const predMap = new Map(preds.map(p => [p.player_id, p.data]))
      const ranked: RankEntry[] = players.map(p => {
        const bd = predMap.get(p.id) ?? null
        return {
          player_id: p.id,
          pseudo: p.pseudo,
          breakdown: bd ? calculateScore(bd, realData) : { groups: 0, r16: 0, quarters: 0, semis: 0, final: 0, thirdPlace: 0, total: 0 },
          champion: bd ? getChampion(bd) : null,
          bracketData: bd,
        }
      })
      if (anyResults) {
        ranked.sort((a, b) => b.breakdown.total - a.breakdown.total)
      } else {
        ranked.sort((a, b) => a.pseudo.localeCompare(b.pseudo))
      }
      setEntries(ranked)
      setLoading(false)
    }
    load()
  }, [])

  const myRank = hasResults ? entries.findIndex(e => e.player_id === player?.id) + 1 : 0
  const myEntry = entries.find(e => e.player_id === player?.id)

  return (
    <div className="max-w-3xl mx-auto">

      {/* Hero band */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 md:px-6 py-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-[32px] font-800 text-[#003087] tracking-tight leading-none">
              Classement
            </h1>
            <p className="text-[13px] text-gray-400 mt-2 font-medium">
              {hasResults ? 'Calculé sur les résultats officiels' : 'Clique sur un nom pour voir son pronostic'}
            </p>
          </div>
          {myRank > 0 && hasResults && myEntry && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Ma position</p>
                <p className="font-condensed text-[32px] font-700 text-[#003087] leading-none">#{myRank}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Mes points</p>
                <p className="font-condensed text-[32px] font-700 text-[#c8102e] leading-none">{myEntry.breakdown.total}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 md:px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-5 h-5 border-2 border-[#003087] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-white border border-gray-200 px-6 py-16 text-center">
            <p className="text-[13px] text-gray-500">Aucun participant pour l'instant.</p>
          </div>
        ) : (
          <div className="space-y-3">

            {/* Banner avant résultats */}
            {!hasResults && (
              <div className="flex items-center gap-3 bg-[#003087]/5 border border-[#003087]/20 px-4 py-3 rounded-lg">
                <span className="text-xl">⚽</span>
                <p className="text-[12px] text-[#003087] font-medium">
                  Le tournoi n'a pas encore commencé — les scores seront calculés au coup d'envoi. Clique sur un nom pour voir son pronostic !
                </p>
              </div>
            )}

            {/* Top 3 podium cards — seulement avec résultats */}
            {hasResults && entries.length >= 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {entries.slice(0, Math.min(3, entries.length)).map((entry, i) => {
                  const isCurrent = entry.player_id === player?.id
                  return (
                    <button key={entry.player_id}
                      onClick={() => setSelectedEntry(entry)}
                      className={`border-2 ${isCurrent ? 'border-[#003087]' : MEDAL_BG[i].split(' ')[1]} bg-white shadow-sm p-4 relative text-left hover:shadow-md transition-shadow`}
                    >
                      <div className="absolute top-3 right-3 text-2xl">{MEDAL[i]}</div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">#{i + 1}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`w-8 h-8 flex items-center justify-center text-[12px] font-black uppercase shrink-0 ${isCurrent ? 'bg-[#003087] text-white' : 'bg-gray-100 text-gray-600'}`}>
                          {entry.pseudo[0]}
                        </span>
                        <span className={`font-condensed text-[18px] font-700 uppercase tracking-wide ${isCurrent ? 'text-[#003087]' : 'text-[#111827]'}`}>
                          {entry.pseudo}
                        </span>
                      </div>
                      <p className="font-condensed text-[36px] font-800 text-[#c8102e] leading-none">{entry.breakdown.total}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">pts</p>
                      {entry.champion && (
                        <p className="text-[11px] text-gray-500 mt-2 truncate">{entry.champion.flag} {entry.champion.name}</p>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Table : tous avant résultats, rank 4+ après */}
            {(hasResults ? entries.slice(3) : entries).length > 0 && (
              <div className="bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center px-4 py-2 bg-gray-50 border-b border-gray-200 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  <span className="w-8 shrink-0">#</span>
                  <span className="flex-1 min-w-0">Joueur</span>
                  {hasResults && <span className="hidden sm:block text-[10px] text-gray-300 font-medium normal-case tracking-normal w-28 text-center shrink-0">G · 1/8 · Q · D · F</span>}
                  <span className="w-14 text-right shrink-0">{hasResults ? 'Pts' : ''}</span>
                  <span className="hidden sm:block w-36 text-right shrink-0">{hasResults ? 'Champion' : 'Champion prédit'}</span>
                </div>
                {(hasResults ? entries.slice(3) : entries).map((entry, i) => {
                  const rank = hasResults ? i + 4 : i + 1
                  const isCurrent = entry.player_id === player?.id
                  return (
                    <div key={entry.player_id}
                      className={`flex items-center px-4 py-3 border-b border-gray-100 last:border-0 transition-colors
                        ${isCurrent ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      <span className="w-8 text-[14px] font-bold text-gray-400 shrink-0">{rank}</span>
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <span className={`w-7 h-7 flex items-center justify-center text-[11px] font-black uppercase shrink-0 ${isCurrent ? 'bg-[#003087] text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {entry.pseudo[0]}
                        </span>
                        <div className="min-w-0 flex-1">
                          <button
                            onClick={() => setSelectedEntry(entry)}
                            className={`text-[13px] font-semibold text-left hover:underline truncate max-w-full block ${isCurrent ? 'text-[#003087]' : 'text-[#111827]'}`}
                          >
                            {entry.pseudo}{isCurrent && <span className="ml-1 text-[11px] font-normal text-gray-400">(moi)</span>}
                          </button>
                          {hasResults && (
                            <p className="text-[11px] text-gray-400 sm:hidden">
                              {entry.breakdown.groups} · {entry.breakdown.r16} · {entry.breakdown.quarters} · {entry.breakdown.semis} · {entry.breakdown.final}
                            </p>
                          )}
                          {!entry.bracketData && (
                            <p className="text-[11px] text-gray-300 italic">Non soumis</p>
                          )}
                        </div>
                      </div>
                      {hasResults && <span className="hidden sm:block text-[11px] text-gray-300 w-28 text-center shrink-0">{entry.breakdown.groups} · {entry.breakdown.r16} · {entry.breakdown.quarters} · {entry.breakdown.semis} · {entry.breakdown.final}</span>}
                      <span className={`w-14 text-right text-[15px] font-bold shrink-0 ${isCurrent ? 'text-[#c8102e]' : hasResults ? 'text-[#111827]' : 'text-gray-200'}`}>
                        {hasResults ? entry.breakdown.total : '—'}
                      </span>
                      <span className="hidden sm:block w-36 text-right text-[11px] text-gray-400 truncate pl-2 shrink-0">
                        {entry.champion ? `${entry.champion.flag} ${entry.champion.name}` : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Barème */}
            <div className="mt-4 border border-dashed border-gray-200 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Barème</p>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-gray-500">
                <span>Groupe : <strong>2 pts</strong>/équipe</span>
                <span>1/8 : <strong>5 pts</strong></span>
                <span>Quart : <strong>10 pts</strong></span>
                <span>Demi : <strong>15 pts</strong></span>
                <span>Finale : <strong>25 pts</strong></span>
                <span>3e place : <strong>10 pts</strong></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedEntry && <PlayerModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />}
    </div>
  )
}
