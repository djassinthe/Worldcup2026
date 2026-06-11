import { useState, useEffect, useMemo, type ReactNode } from 'react'
import { Trophy, Target, CalendarDays, Crown, Flame, TrendingUp, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  type BracketData,
  GROUP_TEAMS,
  GROUPS,
  R32_MATCHES,
  type R32GroupMatch,
  migrateData,
  getChampion,
  getR32Team,
  getR16Team,
  getQuarterTeam,
  getSemiTeam,
  getFinalTeam,
} from '../utils/bracketData'
import { calculateScore, type ScoreBreakdown } from '../utils/scoreUtils'
import { avatarColor, initials } from '../components/ui/tokens'

// ════════════════════════════════════════════════════════════════════════════
//  ProfilV2 — premium fantasy-sports profile (route: /profil-v2)
//  Visual system identical to ClassementV2. Data logic mirrors ProfilPage.
// ════════════════════════════════════════════════════════════════════════════

// ─── Atoms (identical to ClassementV2) ─────────────────────────────────────────

function Avatar({ name, size = 48, ring = false }: { name: string; size?: number; ring?: boolean }) {
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full font-900 text-white"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        background: avatarColor(name),
        boxShadow: ring ? '0 6px 18px rgba(0,0,0,0.18)' : '0 1px 3px rgba(0,0,0,0.15)',
        border: ring ? '4px solid #fff' : 'none',
      }}
    >
      {initials(name)}
    </div>
  )
}

function Spark({ pts, color = '#22c55e', w = 240, h = 46 }: { pts: number[]; color?: string; w?: number; h?: number }) {
  if (pts.length < 2) return null
  const mn = Math.min(...pts), mx = Math.max(...pts), rng = mx - mn || 1
  const d = pts.map((v, i) => { const x = (i / (pts.length - 1)) * w; const y = h - 3 - ((v - mn) / rng) * (h - 6); return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}` }).join(' ')
  const area = `${d} L${w},${h} L0,${h} Z`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id="sparkprofile" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkprofile)" />
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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

// ─── Knockout summary atoms (V2-reskinned) ──────────────────────────────────────

function SectionLines({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="border-b border-gray-100 bg-[#fafbfc] px-7 py-3">
        <p className="text-[10px] font-700 uppercase tracking-[0.16em] text-gray-400">{title}</p>
      </div>
      <div className="divide-y divide-gray-50">{children}</div>
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
    <div className="flex items-center gap-3 px-7 py-3 text-[13px]">
      <span className="w-10 shrink-0 text-[10px] font-700 uppercase tracking-wide text-gray-300">{label}</span>
      <span className={`flex-1 truncate font-600 ${winner && t1 && winner.name === t1.name ? 'text-brand-navy' : 'text-gray-400'}`}>
        {t1 ? `${t1.flag} ${t1.name}` : '—'}
      </span>
      <span className="shrink-0 text-[10px] font-600 text-gray-300">vs</span>
      <span className={`flex-1 truncate text-right font-600 ${winner && t2 && winner.name === t2.name ? 'text-brand-navy' : 'text-gray-400'}`}>
        {t2 ? `${t2.flag} ${t2.name}` : '—'}
      </span>
      <span className="w-4 shrink-0 text-right text-[12px] font-700 text-brand-navy">{winner ? '✓' : ''}</span>
    </div>
  )
}

// ─── Helpers (identical to ClassementV2) ────────────────────────────────────────

function daysUntil(d: string) { return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)) }
function countGood(bd: ScoreBreakdown) { return [bd.groups, bd.r32, bd.r16, bd.quarters, bd.semis, bd.final, bd.thirdPlace].filter(v => v > 0).length }
const T_START = '2026-06-11'

const BAREME: [string, string][] = [['Groupe', '2'], ['16e', '2'], ['1/8', '5'], ['Quart', '10'], ['Demi', '15'], ['Finale', '25'], ['3e place', '10']]

const PHASES: { key: keyof ScoreBreakdown; label: string; max: number }[] = [
  { key: 'groups', label: 'Phase de groupes', max: 48 },
  { key: 'r32', label: 'Seizièmes', max: 32 },
  { key: 'r16', label: 'Huitièmes', max: 40 },
  { key: 'quarters', label: 'Quarts de finale', max: 40 },
  { key: 'semis', label: 'Demi-finales', max: 30 },
  { key: 'final', label: 'Finale', max: 25 },
  { key: 'thirdPlace', label: '3e place', max: 10 },
]

// ════════════════════════════════════════════════════════════════════════════
//  Page
// ════════════════════════════════════════════════════════════════════════════

export default function ProfilV2() {
  const { player } = useAuth()
  const [bracket, setBracket] = useState<BracketData | null>(null)
  const [breakdown, setBreakdown] = useState<ScoreBreakdown | null>(null)
  const [hasResults, setHasResults] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'groupes' | 'eliminatoire'>('groupes')
  const days = daysUntil(T_START)

  useEffect(() => {
    async function load() {
      if (!player) return
      const [predRes, resultsRes] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('bracket_predictions').select('data').eq('player_id', player.id).maybeSingle(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('tournament_results').select('data').limit(1).maybeSingle(),
      ])
      const pred: unknown = predRes.data?.data ?? null
      const real: BracketData = migrateData(resultsRes.data?.data ?? null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyResults = real.r32.some((x: any) => x !== null) ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.values(real.groupQualified).some((q: any) => q[0] !== 0 || q[1] !== 1)
      setHasResults(anyResults)
      if (pred) {
        const migrated = migrateData(pred)
        setBracket(migrated)
        if (anyResults) setBreakdown(calculateScore(migrated, real))
      }
      setLoading(false)
    }
    load()
  }, [player])

  const champion = bracket ? getChampion(bracket) : null
  const total = breakdown?.total ?? 0
  const good = useMemo(() => breakdown ? countGood(breakdown) : 0, [breakdown])
  const pseudo = player?.pseudo ?? '—'

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
            <h1 className="font-condensed bg-gradient-to-br from-gray-900 to-[#1f3a6e] bg-clip-text text-[46px] font-800 uppercase leading-[0.9] tracking-[0.01em] text-transparent sm:text-[64px] md:text-[76px]">Mon profil</h1>
            <p className="mt-3 max-w-lg text-[16px] leading-relaxed text-gray-500">
              {hasResults
                ? "Voici ton parcours et le détail de ton score, phase par phase."
                : 'Voici ton pronostic. Les scores seront calculés dès le coup d\'envoi.'}
            </p>
          </div>
          <div className="relative flex shrink-0 flex-wrap divide-x divide-gray-200/70 rounded-[20px] border border-white/80 bg-white/70 py-3 shadow-[0_8px_24px_rgba(20,30,60,0.07)] backdrop-blur">
            <Stat icon={<Trophy size={24} strokeWidth={2} />} value={total} label="points" gold />
            <Stat icon={<Target size={24} strokeWidth={2} />} value={hasResults ? `${good}/7` : (bracket ? '✓' : '—')} label={hasResults ? 'phases gagnées' : 'bracket soumis'} />
            <Stat icon={<CalendarDays size={24} strokeWidth={2} />} value={days === 0 ? 'Auj.' : days} label={days === 0 ? 'jour J' : `jour${days > 1 ? 's' : ''} restants`} />
            <Stat icon={<Crown size={24} strokeWidth={2} />} value={champion ? champion.flag : '—'} label="champion" />
          </div>
        </div>

        {loading ? (
          <div className="flex h-[280px] items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand-navy border-t-transparent" />
          </div>
        ) : !bracket ? (
          <div className="mt-6 rounded-3xl bg-white px-10 py-20 text-center shadow-[0_2px_12px_rgba(20,30,60,0.05)]">
            <p className="font-condensed text-[24px] font-700 uppercase tracking-wide text-brand-navy">Bracket non soumis</p>
            <p className="mt-2 text-[14px] text-gray-400">Remplis ton bracket dans la section Bracket pour voir ton profil.</p>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">

            {/* ── MAIN: HERO + BREAKDOWN + KNOCKOUT in connected cards ──── */}
            <div className="flex min-w-0 flex-1 flex-col gap-6">

              <div className="overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_18px_50px_rgba(20,30,60,0.10),0_2px_8px_rgba(20,30,60,0.06)]">

                {/* Hero "lid" — personal champion card (same scale as podium) */}
                <div className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-b from-[#eaf1fa] via-[#f4f8fc] to-white px-6 pt-16 pb-12 md:px-10 md:pt-20" style={{ zoom: 0.64 }}>
                  {/* arena spotlight */}
                  <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-b-full bg-[radial-gradient(ellipse_at_top,rgba(245,166,35,0.14)_0%,transparent_62%)]" />
                  <div className="relative mx-auto flex max-w-[520px] justify-center">
                    <div className="group relative z-10 flex w-full flex-col items-center rounded-[30px] border-2 border-[#eac84a] bg-gradient-to-b from-[#ffeeb0] via-[#fffdf3] to-white px-7 pt-11 pb-14 shadow-[0_30px_72px_rgba(245,166,35,0.40),0_0_0_6px_rgba(245,166,35,0.10),inset_0_1px_0_rgba(255,255,255,0.8)]">
                      {/* radiant glow behind the avatar */}
                      <div className="pointer-events-none absolute left-1/2 top-2 h-56 w-56 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(245,166,35,0.32)_0%,transparent_68%)] blur-xl" />
                      {/* profile ribbon */}
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#f5a623] to-[#e0830a] px-6 py-2 shadow-[0_8px_20px_rgba(245,166,35,0.5)]">
                        <span className="font-condensed text-[15px] font-800 uppercase tracking-[0.14em] text-white">★ Mon profil</span>
                      </div>
                      <div className="relative mb-2 mt-3"><Avatar name={pseudo} size={134} ring /></div>
                      <p className="font-condensed relative mt-6 text-[68px] font-800 leading-none text-gray-900">{pseudo}</p>
                      {champion
                        ? <p className="relative mt-3 mb-9 text-[22px] font-600 text-[#d97706]">{champion.flag} {champion.name}</p>
                        : <p className="relative mt-3 mb-9 text-[22px] text-gray-300">—</p>}
                      <div className="relative rounded-full bg-gradient-to-br from-[#0a3f9e] via-brand-navy to-[#00184a] px-20 py-7 shadow-[0_14px_34px_rgba(0,48,135,0.42),inset_0_1px_0_rgba(255,255,255,0.18)]">
                        <span className="font-condensed text-[64px] font-800 leading-none text-white">{total}</span>
                        <span className="font-condensed ml-2.5 text-[24px] font-600 text-white/70">pts</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Breakdown header */}
                <div className="hidden grid-cols-[1fr_220px_120px] items-center gap-2 border-b border-gray-100 bg-[#fafbfc] px-7 py-4 sm:grid">
                  {['PHASE', 'PROGRESSION', 'POINTS'].map((h, i) => (
                    <span key={h} className={`text-[10px] font-700 uppercase tracking-[0.16em] text-gray-400 ${i === 0 ? 'text-left' : 'text-center'}`}>{h}</span>
                  ))}
                </div>

                {/* Breakdown rows */}
                {hasResults && breakdown ? (
                  <div className="divide-y divide-gray-100">
                    {PHASES.map(({ key, label, max }) => {
                      const val = breakdown[key]
                      const pct = Math.round((val / max) * 100)
                      return (
                        <div key={key} className="grid min-h-[64px] grid-cols-[1fr_auto] items-center gap-3 px-5 sm:grid-cols-[1fr_220px_120px] sm:px-7">
                          <span className="text-[15px] font-600 text-gray-900">{label}</span>
                          <div className="hidden items-center sm:flex">
                            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                              <div className="h-full rounded-full bg-gradient-to-r from-[#0a3f9e] to-brand-navy" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                          <div className="text-right sm:text-center">
                            <span className="inline-flex items-baseline gap-1">
                              <strong className="font-condensed text-[28px] font-800 leading-none text-brand-navy">{val}</strong>
                              <span className="text-[12px] text-gray-400">/ {max}</span>
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                    <span className="font-condensed flex h-[64px] w-[64px] items-center justify-center rounded-2xl bg-gradient-to-br from-[#eef2f8] to-[#f7f9fc] text-brand-navy"><CalendarDays size={28} /></span>
                    <p className="mt-4 text-[15px] font-600 text-gray-900">Score disponible dès le coup d'envoi</p>
                    <p className="mt-1 max-w-sm text-[13px] text-gray-400">Le détail par phase apparaîtra ici après la saisie des résultats officiels.</p>
                  </div>
                )}

                {/* Legend footer */}
                <div className="flex flex-wrap items-center gap-x-1 gap-y-1 border-t border-gray-100 bg-[#fafbfc] px-7 py-4 text-[12px] text-gray-500">
                  <span className="mr-2 font-700 uppercase tracking-wide text-gray-400">Barème</span>
                  {BAREME.map(([l, v], i) => (
                    <span key={l} className="flex items-center gap-1">
                      <span className="text-gray-500">{l}</span>
                      <strong className="font-700 text-brand-navy">{v}</strong>
                      {i < BAREME.length - 1 && <span className="mx-1.5 text-gray-300">·</span>}
                    </span>
                  ))}
                </div>
              </div>

              {/* ── BRACKET SUMMARY (tabs) ──────────────────────────────── */}
              <div className="overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_18px_50px_rgba(20,30,60,0.10),0_2px_8px_rgba(20,30,60,0.06)]">
                <div className="flex border-b border-gray-100">
                  {([{ id: 'groupes', label: 'Groupes' }, { id: 'eliminatoire', label: 'Phase éliminatoire' }] as const).map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                      className={`relative px-6 py-4 text-[12px] font-700 uppercase tracking-[0.1em] transition-colors ${tab === t.id ? 'text-brand-navy' : 'text-gray-400 hover:text-gray-700'}`}
                    >
                      {t.label}
                      {tab === t.id && <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-brand-navy" />}
                    </button>
                  ))}
                </div>

                {tab === 'groupes' && (
                  <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 sm:grid-cols-3">
                    {GROUPS.map(g => {
                      const [i1, i2, i3] = bracket.groupQualified[g] as [number, number, number]
                      const t1 = i1 !== -1 ? GROUP_TEAMS[g][i1] : null
                      const t2 = i2 !== -1 ? GROUP_TEAMS[g][i2] : null
                      const t3 = (i3 !== undefined && i3 !== -1) ? GROUP_TEAMS[g][i3] : null
                      return (
                        <div key={g} className="px-5 py-4">
                          <p className="font-condensed mb-2 text-[12px] font-700 uppercase tracking-[0.12em] text-brand-navy">Groupe {g}</p>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[13px]">
                              <span className="w-3 shrink-0 text-[10px] font-700 text-brand-navy">1</span>
                              {t1 ? <><span className="shrink-0">{t1.flag}</span><span className="truncate font-600 text-gray-900">{t1.name}</span></> : <span className="italic text-gray-300">—</span>}
                            </div>
                            <div className="flex items-center gap-1.5 text-[13px]">
                              <span className="w-3 shrink-0 text-[10px] font-600 text-gray-400">2</span>
                              {t2 ? <><span className="shrink-0">{t2.flag}</span><span className="truncate text-gray-500">{t2.name}</span></> : <span className="italic text-gray-300">—</span>}
                            </div>
                            <div className="flex items-center gap-1.5 text-[13px]">
                              <span className="w-3 shrink-0 text-[10px] font-600 text-gray-300">3</span>
                              {t3 ? <><span className="shrink-0">{t3.flag}</span><span className="truncate text-gray-400">{t3.name}</span></> : <span className="italic text-gray-300">—</span>}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {tab === 'eliminatoire' && (
                  <div>
                    <SectionLines title="Seizièmes de finale">
                      {([0, 2, 3, 5, 10, 11, 13, 15] as const).map(i => {
                        const m = R32_MATCHES[i] as R32GroupMatch
                        const t1 = getR32Team(bracket, i, 0)
                        const t2 = getR32Team(bracket, i, 1)
                        const fmlabels = ['M73', 'M74', 'M75', 'M76', 'M77', 'M78', 'M79', 'M80', 'M81', 'M82', 'M83', 'M84', 'M85', 'M86', 'M87', 'M88']
                        const w = bracket.r32[i]
                        const lbl = `${fmlabels[i]} ${m.t1.rank === 1 ? '1' : '2'}${m.t1.g}v${m.t2.rank === 1 ? '1' : '2'}${m.t2.g}`
                        return <MatchLine key={i} label={lbl} t1={t1} t2={t2} winner={w === 0 ? t1 : w === 1 ? t2 : null} />
                      })}
                      {bracket.bestThirds.length === 8 && ([1, 4, 6, 7, 8, 9, 12, 14] as const).map(i => {
                        const t1 = getR32Team(bracket, i, 0)
                        const t2 = getR32Team(bracket, i, 1)
                        const fmlabels = ['M73', 'M74', 'M75', 'M76', 'M77', 'M78', 'M79', 'M80', 'M81', 'M82', 'M83', 'M84', 'M85', 'M86', 'M87', 'M88']
                        const w = bracket.r32[i]
                        return <MatchLine key={i} label={fmlabels[i]} t1={t1} t2={t2} winner={w === 0 ? t1 : w === 1 ? t2 : null} />
                      })}
                    </SectionLines>
                    <SectionLines title="Huitièmes de finale">
                      {Array.from({ length: 8 }, (_, i) => {
                        const t1 = getR16Team(bracket, i, 0)
                        const t2 = getR16Team(bracket, i, 1)
                        const w = bracket.r16[i]
                        return <MatchLine key={i} label={`H${i + 1}`} t1={t1} t2={t2} winner={w === 0 ? t1 : w === 1 ? t2 : null} />
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
            </div>

            {/* ── SIDEBAR ──────────────────────────────────────────────── */}
            <aside className="flex w-full flex-shrink-0 flex-col gap-6 lg:sticky lg:top-6 lg:w-[384px]">

              <Widget title="Mon champion" icon={<Crown size={22} className="text-brand-gold" />}>
                <div className="flex items-center gap-5 p-6">
                  <div className="font-condensed flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fef9e7] to-[#fdf2cf] text-[34px] shadow-[0_6px_18px_rgba(245,166,35,0.22)]">
                    {champion ? champion.flag : '🏆'}
                  </div>
                  <div>
                    {champion ? (
                      <><p className="mb-1 text-[13px] text-gray-400">vainqueur prédit</p><p className="font-condensed text-[22px] font-700 uppercase text-[#b8860b]">{champion.name}</p></>
                    ) : (
                      <><p className="mb-1 text-[19px] font-700 text-gray-900">Non sélectionné</p><p className="text-[13px] leading-snug text-gray-400">choisis ton champion dans le bracket</p></>
                    )}
                  </div>
                </div>
              </Widget>

              <Widget title="Statut du bracket" accent="red">
                <div className="p-6">
                  <div className="mb-4 flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                    <span className="text-[16px] font-600 text-gray-900">Bracket soumis</span>
                  </div>
                  <div className="flex items-center gap-4 rounded-2xl border border-[#f0dca0] bg-gradient-to-br from-[#fef9e7] to-[#fdf2cf] px-5 py-4">
                    <CheckCircle2 size={34} className="flex-shrink-0 text-brand-gold" />
                    <div>
                      <p className="mb-0.5 text-[11px] uppercase tracking-[0.08em] text-gray-400">Phases gagnées</p>
                      <p className="font-condensed text-[22px] font-700 text-[#b8860b]">{hasResults ? `${good} / 7` : 'En attente'}</p>
                    </div>
                  </div>
                </div>
              </Widget>

              {hasResults && breakdown ? (
                <Widget title="Score total" icon={<Flame size={22} className="text-brand-red" />}>
                  <div className="flex items-center justify-around p-6">
                    <div className="text-center">
                      <p className="font-condensed text-[52px] font-800 leading-none text-brand-red">{total}</p>
                      <p className="mt-1.5 text-[11px] uppercase tracking-[0.1em] text-gray-400">points</p>
                    </div>
                    <div className="h-14 w-px bg-gray-200" />
                    <div className="text-center">
                      <p className="font-condensed text-[52px] font-800 leading-none text-brand-navy">{good}/7</p>
                      <p className="mt-1.5 text-[11px] uppercase tracking-[0.1em] text-gray-400">phases</p>
                    </div>
                  </div>
                </Widget>
              ) : (
                <Widget title="Compte à rebours" icon={<TrendingUp size={22} className="text-brand-navy" />}>
                  <div className="p-6">
                    <p className="font-condensed text-[56px] font-800 leading-none text-brand-navy">{days}<span className="ml-2.5 text-[20px] font-600 text-gray-400">jour{days > 1 ? 's' : ''}</span></p>
                    <p className="mt-3 text-[14px] leading-relaxed text-gray-500">avant le coup d'envoi — ton score démarre à <strong className="text-gray-900">0 pt</strong></p>
                    <div className="mt-4"><Spark pts={[2, 4, 3, 6, 8]} color="#003087" w={300} h={58} /></div>
                  </div>
                </Widget>
              )}

            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
