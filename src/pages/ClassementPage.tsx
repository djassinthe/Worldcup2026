import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Player } from '../types'
import {
  type BracketData,
  migrateData,
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

// ─── Score breakdown mini-grid ─────────────────────────────────────────────────

function BreakdownCells({ bd }: { bd: ScoreBreakdown }) {
  const items = [
    { label: 'Gr', val: bd.groups },
    { label: 'S16', val: bd.r32 },
    { label: '1/8', val: bd.r16 },
    { label: 'Qrt', val: bd.quarters },
    { label: 'Dmi', val: bd.semis },
    { label: 'Fin', val: bd.final + bd.thirdPlace },
  ]
  return (
    <div className="flex items-center gap-3">
      {items.map(({ label, val }) => (
        <div key={label} className="flex flex-col items-center gap-0.5">
          <span className="text-[9px] text-white/25 uppercase tracking-wide leading-none">{label}</span>
          <span className={`text-[12px] font-semibold leading-none tabular-nums ${val > 0 ? 'text-white/65' : 'text-white/20'}`}>{val}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Player Summary Modal ──────────────────────────────────────────────────────

function PlayerModal({ entry, onClose }: { entry: RankEntry; onClose: () => void }) {
  const data = entry.bracketData
  const champion = entry.champion
  const finalist0 = data ? getFinalTeam(data, 0) : null
  const finalist1 = data ? getFinalTeam(data, 1) : null
  const semi0 = data ? getQuarterWinner(data, 0) : null
  const semi1 = data ? getQuarterWinner(data, 1) : null
  const semi2 = data ? getQuarterWinner(data, 2) : null
  const semi3 = data ? getQuarterWinner(data, 3) : null
  const third = data ? getThirdPlace(data) : null

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/65 backdrop-blur-md" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-player-title"
        className="relative w-full sm:max-w-lg sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col bg-[#0a1628] border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#001b4d] to-[#0a1628] px-5 py-5 flex items-center justify-between shrink-0 border-b border-white/8">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8102e]/70 to-transparent" />
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/30 mb-1">Pronostic de</p>
            <p id="modal-player-title" className="font-condensed text-[24px] font-700 uppercase tracking-wide text-white leading-tight">{entry.pseudo}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            autoFocus
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/8 hover:bg-white/15 transition-colors text-white/50 hover:text-white"
          >
            <X size={15} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-white/5">
          {!data ? (
            <div className="px-6 py-12 text-center text-[13px] text-white/30">Aucun bracket soumis.</div>
          ) : (
            <>
              {/* Champion */}
              <div className="px-5 py-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/30 mb-3">Champion</p>
                {champion ? (
                  <div className="flex items-center gap-3 bg-[#f5a623]/10 border border-[#f5a623]/20 rounded-xl px-4 py-3">
                    <span className="text-2xl">{champion.flag}</span>
                    <span className="font-condensed text-[20px] font-700 uppercase tracking-wide text-[#f5a623]">{champion.name}</span>
                    <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-[#f5a623]/50">Champion</span>
                  </div>
                ) : (
                  <p className="text-[13px] text-white/30">Non sélectionné</p>
                )}
              </div>

              {/* Finale */}
              <div className="px-5 py-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/30 mb-3">Finale</p>
                <div className="grid grid-cols-2 gap-2">
                  {[finalist0, finalist1].map((t, i) => t ? (
                    <div key={i} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border ${champion?.name === t.name ? 'bg-[#003087]/40 border-[#003087]/60 text-white' : 'bg-white/5 border-white/10 text-white/65'}`}>
                      <span>{t.flag}</span>
                      <span className="text-[12px] font-semibold truncate">{t.name}</span>
                    </div>
                  ) : (
                    <div key={i} className="px-3 py-2.5 rounded-lg border border-dashed border-white/10 text-[12px] text-white/20">—</div>
                  ))}
                </div>
                {third && (
                  <p className="text-[11px] text-white/35 mt-2.5">
                    <span className="text-white/20">3e place ·</span> {third.flag} {third.name}
                  </p>
                )}
              </div>

              {/* Demi-finalistes */}
              <div className="px-5 py-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/30 mb-3">Demi-finalistes</p>
                <div className="grid grid-cols-2 gap-2">
                  {[semi0, semi1, semi2, semi3].map((t, i) => t ? (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/8 rounded-lg">
                      <span>{t.flag}</span>
                      <span className="text-[12px] font-medium text-white/65 truncate">{t.name}</span>
                    </div>
                  ) : (
                    <div key={i} className="px-3 py-2 rounded-lg border border-dashed border-white/8 text-[12px] text-white/20">—</div>
                  ))}
                </div>
              </div>

              {/* Groupes */}
              <div className="px-5 py-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/30 mb-3">Qualifiés par groupe</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                  {GROUPS.map(g => {
                    const q = data.groupQualified[g]
                    const teams = GROUP_TEAMS[g]
                    const t1 = teams?.[q?.[0]]
                    const t2 = q?.[1] !== -1 ? teams?.[q?.[1]] : null
                    const t3 = (q?.[2] !== undefined && q?.[2] !== -1) ? teams?.[q?.[2]] : null
                    return (
                      <div key={g}>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-white/25 mb-1">Gr. {g}</p>
                        <div className="space-y-0.5">
                          {t1 ? <p className="text-[12px] text-white/70 font-medium">{t1.flag} {t1.name}</p> : <p className="text-[12px] text-white/20">—</p>}
                          {t2 ? <p className="text-[12px] text-white/45">{t2.flag} {t2.name}</p> : <p className="text-[12px] text-white/20">—</p>}
                          {t3 ? <p className="text-[12px] text-white/30">{t3.flag} {t3.name}</p> : null}
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

// ─── Podium card ───────────────────────────────────────────────────────────────

const PODIUM_STYLES = [
  {
    rankLabel: '01',
    rankColor: 'text-[#f5a623]',
    rankSize: 'text-[52px]',
    scoreSize: 'text-[40px]',
    scoreColor: 'text-[#f5a623]',
    border: 'border-2 border-[#f5a623]/30',
    bg: 'bg-[#f5a623]/6',
    accentLine: true,
    elevated: true,
    avatarBg: 'bg-[#f5a623]/15 text-[#f5a623]',
  },
  {
    rankLabel: '02',
    rankColor: 'text-[#94a3b8]',
    rankSize: 'text-[40px]',
    scoreSize: 'text-[30px]',
    scoreColor: 'text-[#94a3b8]',
    border: 'border border-[#94a3b8]/20',
    bg: 'bg-[#94a3b8]/5',
    accentLine: false,
    elevated: false,
    avatarBg: 'bg-white/10 text-white/50',
  },
  {
    rankLabel: '03',
    rankColor: 'text-[#cd7f32]',
    rankSize: 'text-[40px]',
    scoreSize: 'text-[30px]',
    scoreColor: 'text-[#cd7f32]',
    border: 'border border-[#cd7f32]/20',
    bg: 'bg-[#cd7f32]/5',
    accentLine: false,
    elevated: false,
    avatarBg: 'bg-white/10 text-white/50',
  },
]

function PodiumCard({
  entry,
  rank,
  isCurrentPlayer,
  onClick,
}: {
  entry: RankEntry
  rank: 0 | 1 | 2
  isCurrentPlayer: boolean
  onClick: () => void
}) {
  const s = PODIUM_STYLES[rank]
  return (
    <button
      onClick={onClick}
      className={`relative rounded-xl ${s.border} ${s.bg} p-4 text-left w-full transition-all duration-150 hover:brightness-110 active:scale-95 pb-5 ${s.elevated ? '-mt-5' : ''}`}
    >
      {s.accentLine && (
        <div className="absolute top-0 left-0 right-0 h-px rounded-t-xl bg-gradient-to-r from-transparent via-[#f5a623]/50 to-transparent" />
      )}
      <p className={`font-condensed font-700 leading-none ${s.rankColor} ${s.rankSize} mb-3`}>{s.rankLabel}</p>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-black uppercase mb-2.5 shrink-0 ${isCurrentPlayer ? 'bg-[#003087] text-white' : s.avatarBg}`}>
        {entry.pseudo[0]?.toUpperCase() ?? '?'}
      </div>
      <div className="flex items-baseline gap-1.5 mb-0.5 min-w-0">
        <p className={`font-condensed text-[15px] font-600 uppercase tracking-wide leading-tight truncate ${isCurrentPlayer ? 'text-white' : 'text-white/80'}`}>
          {entry.pseudo}
        </p>
        {isCurrentPlayer && (
          <span className="shrink-0 text-[8px] font-semibold bg-[#003087]/50 text-[#6fa0e0] px-1.5 py-0.5 rounded-full uppercase tracking-widest">Moi</span>
        )}
      </div>
      <p className={`font-condensed font-700 leading-none tabular-nums ${s.scoreColor} ${s.scoreSize}`}>{entry.breakdown.total}</p>
      <p className="text-[9px] text-white/25 uppercase tracking-widest font-medium mt-0.5">pts</p>
      {entry.champion && (
        <p className="text-[10px] text-white/30 mt-2 truncate">{entry.champion.flag} {entry.champion.name}</p>
      )}
    </button>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ClassementPage() {
  const { player } = useAuth()
  const [entries, setEntries] = useState<RankEntry[]>([])
  const [hasResults, setHasResults] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<RankEntry | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [resultsRes, predsRes, playersRes] = await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from('tournament_results').select('data').limit(1).maybeSingle(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from('bracket_predictions').select('player_id, data'),
          supabase.from('players').select('id, pseudo'),
        ])
        if (playersRes.error) throw playersRes.error
        const realData: BracketData = migrateData(resultsRes.data?.data ?? null)
        const preds: { player_id: string; data: unknown }[] = predsRes.error ? [] : (predsRes.data ?? [])
        const players: Pick<Player, 'id' | 'pseudo'>[] = playersRes.data ?? []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyResults = realData.r32.some((x: any) => x !== null) ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Object.values(realData.groupQualified).some((q: any) => q[0] !== 0 || q[1] !== 1)
        setHasResults(anyResults)

        const predMap = new Map(preds.map(p => [p.player_id, migrateData(p.data)]))
        const ranked: RankEntry[] = players.map(p => {
          const bd = predMap.get(p.id) ?? null
          return {
            player_id: p.id,
            pseudo: p.pseudo,
            breakdown: bd ? calculateScore(bd, realData) : { groups: 0, r32: 0, r16: 0, quarters: 0, semis: 0, final: 0, thirdPlace: 0, total: 0 },
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
      } catch (err) {
        console.error('Classement load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const myRank = hasResults ? entries.findIndex(e => e.player_id === player?.id) + 1 : 0
  const myEntry = entries.find(e => e.player_id === player?.id)
  const maxScore = entries[0]?.breakdown.total ?? 1

  return (
    <div className="w-full min-h-full bg-[#03061a]">

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#051a3d] to-[#03061a] border-b border-white/5">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8102e]/60 to-transparent" />
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/25 mb-2">FIFA World Cup 2026</p>
            <h1 className="font-condensed text-[46px] font-700 uppercase tracking-wide text-white leading-none">
              Classement
            </h1>
            <p className="text-[11px] text-white/30 mt-1.5 font-medium">
              {hasResults ? 'Calculé sur les résultats officiels' : 'Le tournoi n\'a pas encore commencé'}
            </p>
          </div>
          {myRank > 0 && hasResults && myEntry && (
            <div className="flex items-stretch bg-white/5 border border-white/8 rounded-xl overflow-hidden shrink-0">
              <div className="px-4 py-3 text-center">
                <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-white/30 mb-0.5">Rang</p>
                <p className="font-condensed text-[28px] font-700 text-white leading-none">#{myRank}</p>
              </div>
              <div className="w-px bg-white/8" />
              <div className="px-4 py-3 text-center">
                <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-white/30 mb-0.5">Points</p>
                <p className="font-condensed text-[28px] font-700 text-[#c8102e] leading-none">{myEntry.breakdown.total}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-4">

        {loading ? (
          <div className="flex items-center justify-center h-48" aria-busy="true" aria-label="Chargement…">
            <div className="w-5 h-5 border-2 border-white/15 border-t-white/60 rounded-full animate-spin" role="status" />
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-xl border border-white/8 px-6 py-16 text-center">
            <p className="text-[13px] text-white/35">Aucun participant pour l'instant.</p>
          </div>
        ) : (
          <>
            {/* Pre-tournament notice */}
            {!hasResults && (
              <div className="flex items-start gap-3 bg-[#003087]/15 border border-[#003087]/25 rounded-xl px-4 py-3">
                <div className="w-1 h-1 rounded-full bg-[#5b8ecf] mt-1.5 shrink-0" />
                <p className="text-[12px] text-[#6fa0e0] font-medium leading-relaxed">
                  Les scores seront calculés en temps réel à l'ouverture du tournoi. Clique sur un nom pour voir son pronostic complet.
                </p>
              </div>
            )}

            {/* ── Podium Top 3 ──────────────────────────────────────────────── */}
            {hasResults && entries.length >= 1 && (
              <div className="grid grid-cols-3 gap-2 items-end pt-2">
                {/* 2nd — left */}
                {entries[1]
                  ? <PodiumCard entry={entries[1]} rank={1} isCurrentPlayer={entries[1].player_id === player?.id} onClick={() => setSelectedEntry(entries[1])} />
                  : <div />
                }
                {/* 1st — center, elevated */}
                <PodiumCard entry={entries[0]} rank={0} isCurrentPlayer={entries[0].player_id === player?.id} onClick={() => setSelectedEntry(entries[0])} />
                {/* 3rd — right */}
                {entries[2]
                  ? <PodiumCard entry={entries[2]} rank={2} isCurrentPlayer={entries[2].player_id === player?.id} onClick={() => setSelectedEntry(entries[2])} />
                  : <div />
                }
              </div>
            )}

            {/* ── Ranking list (rank 4+ or all before results) ──────────────── */}
            {(() => {
              const listEntries = hasResults ? entries.slice(3) : entries
              return listEntries.length > 0 && (
              <div className="rounded-xl border border-white/8 overflow-hidden">

                {/* Header */}
                <div className="grid grid-cols-[2.5rem_1fr_3.5rem_6rem] sm:grid-cols-[2.5rem_1fr_11rem_3.5rem_6.5rem] items-center px-4 py-2.5 border-b border-white/8 bg-white/3">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/25">#</span>
                  <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/25">Joueur</span>
                  <span className="hidden sm:block text-[9px] font-semibold uppercase tracking-[0.18em] text-white/25 text-center">Détail</span>
                  <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/25 text-right">Pts</span>
                  <span className="hidden sm:block text-[9px] font-semibold uppercase tracking-[0.18em] text-white/25 text-right">Champion</span>
                </div>

                {listEntries.map((entry, i) => {
                  const rank = hasResults ? i + 4 : i + 1
                  const isCurrent = entry.player_id === player?.id
                  const pct = hasResults && maxScore > 0 ? Math.round((entry.breakdown.total / maxScore) * 100) : 0

                  return (
                    <button
                      key={entry.player_id}
                      type="button"
                      onClick={() => setSelectedEntry(entry)}
                      className={`grid grid-cols-[2.5rem_1fr_3.5rem_6rem] sm:grid-cols-[2.5rem_1fr_11rem_3.5rem_6.5rem] w-full text-left items-center px-4 py-3 border-b border-white/5 last:border-0 transition-colors
                        ${isCurrent ? 'bg-[#003087]/15' : 'hover:bg-white/3'}`}
                    >
                      {/* Rank */}
                      <span className={`font-condensed text-[17px] font-700 tabular-nums leading-none ${isCurrent ? 'text-[#c8102e]' : 'text-white/22'}`}>{rank}</span>

                      {/* Player name + bar */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black uppercase shrink-0 ${isCurrent ? 'bg-[#003087] text-white' : 'bg-white/8 text-white/45'}`}>
                          {entry.pseudo[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`text-[13px] font-semibold truncate leading-none ${isCurrent ? 'text-white' : 'text-white/70'}`}>
                              {entry.pseudo}
                            </span>
                            {isCurrent && (
                              <span className="shrink-0 text-[8px] font-semibold bg-[#003087]/50 text-[#6fa0e0] px-1.5 py-0.5 rounded-full uppercase tracking-widest">Moi</span>
                            )}
                          </div>
                          {!entry.bracketData && (
                            <p className="text-[10px] text-white/22 italic mt-0.5">Non soumis</p>
                          )}
                          {hasResults && entry.bracketData && (
                            <div className="mt-1 h-0.5 w-full bg-white/8 rounded-full overflow-hidden sm:hidden">
                              <div className="h-full bg-[#c8102e]/50 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Breakdown (desktop) */}
                      <div className="hidden sm:flex justify-center">
                        {hasResults && entry.bracketData && <BreakdownCells bd={entry.breakdown} />}
                      </div>

                      {/* Score */}
                      <span className={`text-right font-condensed text-[19px] font-700 leading-none tabular-nums ${isCurrent ? 'text-[#c8102e]' : hasResults ? 'text-white/75' : 'text-white/18'}`}>
                        {hasResults ? entry.breakdown.total : '—'}
                      </span>

                      {/* Champion (desktop) */}
                      <span className="hidden sm:block text-right text-[11px] text-white/30 truncate pl-3">
                        {entry.champion ? `${entry.champion.flag} ${entry.champion.name}` : '—'}
                      </span>
                    </button>
                  )
                })}
              </div>
            )
            })()}

            {/* ── Barème ────────────────────────────────────────────────────── */}
            <div className="rounded-xl border border-white/6 bg-white/2 px-4 py-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/22 mb-2">Barème des points</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-white/35">
                <span>Groupe <span className="text-white/55 font-semibold">2 pts</span></span>
                <span>S16 <span className="text-white/55 font-semibold">2 pts</span></span>
                <span>1/8 <span className="text-white/55 font-semibold">5 pts</span></span>
                <span>Quart <span className="text-white/55 font-semibold">10 pts</span></span>
                <span>Demi <span className="text-white/55 font-semibold">15 pts</span></span>
                <span>Finale <span className="text-white/55 font-semibold">25 pts</span></span>
                <span>3e place <span className="text-white/55 font-semibold">10 pts</span></span>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedEntry && <PlayerModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />}
    </div>
  )
}
