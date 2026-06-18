import { useState, useEffect, useMemo, type ReactNode } from 'react'
import { CalendarDays, MapPin, Trophy, Target, Clock, CheckCircle2, ListOrdered } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Match, Phase } from '../types'
import { PHASE_LABELS } from '../types'
import { computeGroupStandings, type StandingRow } from '../utils/groupStandings'

// ════════════════════════════════════════════════════════════════════════════
//  CalendrierPage — affichage des matchs (route: /calendrier)
//  Signature visuelle identique à ClassementV2 / BracketV2.
// ════════════════════════════════════════════════════════════════════════════

const TZ = 'America/Toronto'
const T_START = '2026-06-11'

function daysUntil(d: string) { return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)) }

const dayKeyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
const dayLabelFmt = new Intl.DateTimeFormat('fr-CA', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' })
const timeFmt = new Intl.DateTimeFormat('fr-CA', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false })

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

// ─── Stat (identique aux autres pages) ──────────────────────────────────────────

function Stat({ icon, value, label, gold = false }: { icon: ReactNode; value: ReactNode; label: string; gold?: boolean }) {
  return (
    <div className="flex flex-1 items-center gap-3 px-5 py-2">
      <span className={`flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-xl ${gold ? 'bg-gradient-to-br from-amber-100 to-amber-50 text-brand-gold shadow-[0_4px_12px_rgba(245,166,35,0.22)]' : 'bg-gradient-to-br from-[#eef2f8] to-[#f7f9fc] text-brand-navy'}`}>{icon}</span>
      <div className="min-w-0">
        <p className="font-condensed text-[40px] font-800 leading-none text-gray-900">{value}</p>
        <p className="mt-1 text-[11px] font-700 uppercase leading-tight tracking-[0.05em] text-gray-400">{label}</p>
      </div>
    </div>
  )
}

// ─── Ligne de match ─────────────────────────────────────────────────────────────

function MatchRow({ m }: { m: Match }) {
  const played = m.score_home !== null && m.score_away !== null
  const time = timeFmt.format(new Date(m.kickoff_at))
  const homeWin = played && (m.score_home as number) > (m.score_away as number)
  const awayWin = played && (m.score_away as number) > (m.score_home as number)

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[#f7f9fc] sm:px-6">
      {/* Heure / statut */}
      <div className="flex w-[68px] flex-shrink-0 flex-col items-center gap-1">
        {played ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-[3px] text-[10px] font-700 uppercase tracking-wide text-green-700">
            <CheckCircle2 size={11} /> Fini
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#eef2f8] px-2 py-[3px] text-[11px] font-700 text-brand-navy">
            <Clock size={11} /> {time}
          </span>
        )}
      </div>

      {/* Domicile */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5 text-right">
        <span className={`truncate text-[14px] sm:text-[15px] ${homeWin ? 'font-800 text-gray-900' : 'font-600 text-gray-600'}`}>{m.team_home}</span>
        <span className="text-[22px] leading-none">{m.flag_home}</span>
      </div>

      {/* Score / vs */}
      <div className="flex w-[64px] flex-shrink-0 items-center justify-center">
        {played ? (
          <span className="font-condensed inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[#0a3f9e] to-brand-navy px-3 py-1.5 text-[18px] font-800 leading-none text-white shadow-[0_4px_12px_rgba(0,48,135,0.28)]">
            <span className={homeWin ? 'text-white' : 'text-white/70'}>{m.score_home}</span>
            <span className="text-white/40">–</span>
            <span className={awayWin ? 'text-white' : 'text-white/70'}>{m.score_away}</span>
          </span>
        ) : (
          <span className="text-[11px] font-700 uppercase tracking-widest text-gray-300">vs</span>
        )}
      </div>

      {/* Extérieur */}
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <span className="text-[22px] leading-none">{m.flag_away}</span>
        <span className={`truncate text-[14px] sm:text-[15px] ${awayWin ? 'font-800 text-gray-900' : 'font-600 text-gray-600'}`}>{m.team_away}</span>
      </div>

      {/* Groupe + lieu */}
      <div className="hidden w-[150px] flex-shrink-0 flex-col items-end gap-1 md:flex">
        {m.group_name && (
          <span className="rounded-md bg-[#eef2f8] px-2 py-[2px] text-[10px] font-800 uppercase tracking-wide text-brand-navy">Gr. {m.group_name}</span>
        )}
        {m.venue && (
          <span className="inline-flex max-w-full items-center gap-1 truncate text-[11px] text-gray-400">
            <MapPin size={11} className="flex-shrink-0" /> <span className="truncate">{m.venue}</span>
          </span>
        )}
      </div>
    </div>
  )
}

function StandingsTable({ group, rows }: { group: string; rows: StandingRow[] }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_18px_50px_rgba(20,30,60,0.10),0_2px_8px_rgba(20,30,60,0.06)]">
      {/* Entête de groupe */}
      <div className="relative flex items-center justify-between overflow-hidden border-b border-gray-100 bg-gradient-to-r from-[#003087] via-[#002b73] to-[#1f3a6e] px-6 py-4">
        <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(245,166,35,0.18)_0%,transparent_70%)]" />
        <p className="font-condensed relative text-[20px] font-800 uppercase tracking-wide text-white">Groupe {group}</p>
      </div>
      {/* Entête de colonnes */}
      <div className="grid grid-cols-[28px_1fr_28px_28px_28px_28px_44px_36px] items-center gap-1 border-b border-gray-100 bg-[#fafbfc] px-4 py-2.5 sm:px-6">
        <span className="text-[10px] font-700 uppercase tracking-wide text-gray-400">#</span>
        <span className="text-[10px] font-700 uppercase tracking-wide text-gray-400">Équipe</span>
        {['J', 'G', 'N', 'P'].map(h => <span key={h} className="text-center text-[10px] font-700 uppercase tracking-wide text-gray-400">{h}</span>)}
        <span className="text-center text-[10px] font-700 uppercase tracking-wide text-gray-400">+/−</span>
        <span className="text-center text-[10px] font-800 uppercase tracking-wide text-brand-navy">Pts</span>
      </div>
      {/* Lignes */}
      <div className="divide-y divide-gray-100">
        {rows.map((r, i) => {
          const qualifies = i < 2
          return (
            <div key={r.name} className={`grid grid-cols-[28px_1fr_28px_28px_28px_28px_44px_36px] items-center gap-1 px-4 py-2.5 sm:px-6 ${qualifies ? 'bg-[#f7faff]' : ''}`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-800 ${i === 0 ? 'bg-gradient-to-br from-[#f5a623] to-[#f7b94e] text-[#003087]' : qualifies ? 'bg-[#dbe7fb] text-brand-navy' : 'text-gray-400'}`}>{i + 1}</span>
              <span className="flex min-w-0 items-center gap-2">
                <span className="text-[18px] leading-none">{r.flag}</span>
                <span className={`truncate text-[13px] sm:text-[14px] ${qualifies ? 'font-700 text-gray-900' : 'font-500 text-gray-600'}`}>{r.name}</span>
              </span>
              <span className="text-center text-[12px] font-600 text-gray-500">{r.played}</span>
              <span className="text-center text-[12px] font-600 text-gray-500">{r.win}</span>
              <span className="text-center text-[12px] font-600 text-gray-500">{r.draw}</span>
              <span className="text-center text-[12px] font-600 text-gray-500">{r.loss}</span>
              <span className={`text-center text-[12px] font-700 ${r.gd > 0 ? 'text-green-600' : r.gd < 0 ? 'text-red-500' : 'text-gray-500'}`}>{r.gd > 0 ? `+${r.gd}` : r.gd}</span>
              <span className="text-center font-condensed text-[16px] font-800 text-brand-navy">{r.pts}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  Page
// ════════════════════════════════════════════════════════════════════════════

export default function CalendrierPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<Phase | 'all'>('all')
  const [view, setView] = useState<'matches' | 'standings'>('matches')
  const days = daysUntil(T_START)

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from('matches')
          .select('*')
          .order('kickoff_at', { ascending: true })
        if (error) throw error
        setMatches((data ?? []) as Match[])
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    load()
  }, [])

  const playedCount = matches.filter(m => m.score_home !== null && m.score_away !== null).length

  // Prochain match (à venir) le plus proche
  const nextMatch = useMemo(() => {
    const now = Date.now()
    return matches.find(m => m.score_home === null && new Date(m.kickoff_at).getTime() >= now) ?? null
  }, [matches])

  const phasesPresent = useMemo(() => {
    const set = new Set<Phase>()
    for (const m of matches) set.add(m.phase)
    return (Object.keys(PHASE_LABELS) as Phase[]).filter(p => set.has(p))
  }, [matches])

  const filtered = useMemo(
    () => (phase === 'all' ? matches : matches.filter(m => m.phase === phase)),
    [matches, phase],
  )

  // Regroupement par jour (fuseau America/Toronto)
  const days_grouped = useMemo(() => {
    const map = new Map<string, Match[]>()
    for (const m of filtered) {
      const key = dayKeyFmt.format(new Date(m.kickoff_at))
      const arr = map.get(key)
      if (arr) arr.push(m); else map.set(key, [m])
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [filtered])

  const standings = useMemo(() => computeGroupStandings(matches), [matches])
  const hasGroupMatches = standings.length > 0

  return (
    <div className="min-h-full w-full px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-[1280px]">

        {/* ── HEADER CARD ─────────────────────────────────────────────── */}
        <div className="relative flex flex-col gap-8 overflow-hidden rounded-[28px] border border-white/60 bg-gradient-to-br from-white via-white to-[#eef3fb] px-7 py-8 shadow-[0_14px_44px_rgba(20,30,60,0.10),0_2px_6px_rgba(20,30,60,0.05)] md:px-11 md:py-11 lg:flex-row lg:items-center lg:justify-between" style={{ zoom: 0.8 }}>
          <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(245,166,35,0.16)_0%,transparent_70%)]" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(0,48,135,0.07)_0%,transparent_70%)]" />
          <div className="relative min-w-0">
            <p className="mb-2 inline-flex items-center gap-2 text-[14px] font-700 uppercase tracking-[0.24em] text-brand-navy">
              <CalendarDays size={16} className="text-brand-gold" /> FIFA World Cup 2026
            </p>
            <h1 className="font-condensed bg-gradient-to-br from-gray-900 to-[#1f3a6e] bg-clip-text text-[46px] font-800 uppercase leading-[0.9] tracking-[0.01em] text-transparent sm:text-[64px] md:text-[76px]">Calendrier</h1>
            <p className="mt-3 max-w-lg text-[16px] leading-relaxed text-gray-500">
              Tous les matchs du tournoi, heure de l'Est (Toronto/Montréal). Les scores apparaissent dès qu'ils sont saisis.
            </p>
          </div>
          <div className="relative flex shrink-0 flex-wrap divide-x divide-gray-200/70 rounded-[20px] border border-white/80 bg-white/70 py-3 shadow-[0_8px_24px_rgba(20,30,60,0.07)] backdrop-blur">
            <Stat icon={<CalendarDays size={24} strokeWidth={2} />} value={matches.length} label="matchs" />
            <Stat icon={<Target size={24} strokeWidth={2} />} value={playedCount} label="matchs joués" />
            <Stat icon={<CalendarDays size={24} strokeWidth={2} />} value={days === 0 ? 'Auj.' : days} label={days === 0 ? 'jour J' : `jour${days > 1 ? 's' : ''} restants`} />
            <Stat icon={<Trophy size={24} strokeWidth={2} />} value={playedCount} label="résultats" gold />
          </div>
        </div>

        {/* ── SÉLECTEUR DE VUE ────────────────────────────────────────── */}
        {hasGroupMatches && (
          <div className="mt-6 inline-flex rounded-2xl border border-white/70 bg-white p-1 shadow-[0_4px_16px_rgba(20,30,60,0.07)]">
            <button
              onClick={() => setView('matches')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-700 uppercase tracking-[0.08em] transition-all ${view === 'matches' ? 'bg-gradient-to-br from-[#0a3f9e] to-brand-navy text-white shadow-[0_4px_12px_rgba(0,48,135,0.28)]' : 'text-gray-500 hover:text-brand-navy'}`}
            >
              <CalendarDays size={15} /> Matchs
            </button>
            <button
              onClick={() => setView('standings')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-700 uppercase tracking-[0.08em] transition-all ${view === 'standings' ? 'bg-gradient-to-br from-[#0a3f9e] to-brand-navy text-white shadow-[0_4px_12px_rgba(0,48,135,0.28)]' : 'text-gray-500 hover:text-brand-navy'}`}
            >
              <ListOrdered size={15} /> Classement des groupes
            </button>
          </div>
        )}

        {/* ── FILTRES PAR PHASE ───────────────────────────────────────── */}
        {view === 'matches' && phasesPresent.length > 1 && (
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => setPhase('all')}
              className={`rounded-xl px-4 py-2 text-[12px] font-700 uppercase tracking-[0.08em] transition-all ${phase === 'all' ? 'bg-gradient-to-br from-[#0a3f9e] to-brand-navy text-white shadow-[0_4px_12px_rgba(0,48,135,0.28)]' : 'bg-white text-gray-500 shadow-[0_2px_8px_rgba(20,30,60,0.06)] hover:text-brand-navy'}`}
            >
              Tous
            </button>
            {phasesPresent.map(p => (
              <button
                key={p}
                onClick={() => setPhase(p)}
                className={`rounded-xl px-4 py-2 text-[12px] font-700 uppercase tracking-[0.08em] transition-all ${phase === p ? 'bg-gradient-to-br from-[#0a3f9e] to-brand-navy text-white shadow-[0_4px_12px_rgba(0,48,135,0.28)]' : 'bg-white text-gray-500 shadow-[0_2px_8px_rgba(20,30,60,0.06)] hover:text-brand-navy'}`}
              >
                {PHASE_LABELS[p]}
              </button>
            ))}
          </div>
        )}

        {/* ── CONTENU ─────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex h-[280px] items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand-navy border-t-transparent" />
          </div>
        ) : view === 'standings' ? (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {standings.map(s => <StandingsTable key={s.group} group={s.group} rows={s.rows} />)}
          </div>
        ) : days_grouped.length === 0 ? (
          <div className="mt-6 rounded-[28px] border border-white/60 bg-white px-10 py-20 text-center shadow-[0_2px_12px_rgba(20,30,60,0.05)]">
            <CalendarDays size={40} className="mx-auto mb-4 text-gray-300" strokeWidth={1.5} />
            <p className="text-[15px] font-600 text-gray-500">Aucun match pour l'instant.</p>
            <p className="mt-1 text-[13px] text-gray-400">Les rencontres apparaîtront ici dès qu'elles seront chargées.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {days_grouped.map(([key, dayMatches]) => {
              const dateObj = new Date(dayMatches[0].kickoff_at)
              const isNextDay = nextMatch && dayKeyFmt.format(new Date(nextMatch.kickoff_at)) === key
              return (
                <div key={key} className="overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_18px_50px_rgba(20,30,60,0.10),0_2px_8px_rgba(20,30,60,0.06)]">
                  {/* Entête de jour */}
                  <div className="relative flex items-center justify-between overflow-hidden border-b border-gray-100 bg-gradient-to-r from-[#003087] via-[#002b73] to-[#1f3a6e] px-6 py-4">
                    <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(245,166,35,0.18)_0%,transparent_70%)]" />
                    <p className="font-condensed relative text-[20px] font-800 uppercase tracking-wide text-white">{cap(dayLabelFmt.format(dateObj))}</p>
                    <div className="relative flex items-center gap-2">
                      {isNextDay && (
                        <span className="rounded-full bg-gradient-to-br from-[#f5a623] to-[#f7b94e] px-2.5 py-[3px] text-[10px] font-800 uppercase tracking-wide text-[#003087] shadow-[0_3px_10px_rgba(245,166,35,0.4)]">À venir</span>
                      )}
                      <span className="rounded-full bg-white/12 px-2.5 py-[3px] text-[11px] font-700 text-white/80">{dayMatches.length} match{dayMatches.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  {/* Matchs du jour */}
                  <div className="divide-y divide-gray-100">
                    {dayMatches.map(m => <MatchRow key={m.id} m={m} />)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
