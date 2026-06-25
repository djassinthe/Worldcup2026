import { useState, useEffect } from 'react'
import React from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import type { Match, Phase } from '../types'
import { PHASE_LABELS, PHASE_POINTS } from '../types'
import {
  type BracketData,
  type Team,
  type R32GroupMatch,
  type R32ThirdMatch,
  GROUP_TEAMS,
  GROUPS,
  R32_MATCHES,
  DEFAULT_DATA,
  migrateData,
  getR32Team,
  getR16Team,
  getQuarterTeam,
  getSemiTeam,
  getSemiLoser,
  getFinalTeam,
  getChampion,
} from '../utils/bracketData'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const PHASES: Phase[] = ['groupes', 'seiziemes', 'huitiemes', 'quarts', 'demis', 'finale']

// World Cup 2026 teams with flags
const TEAMS = [
  { name: 'Argentine', flag: '🇦🇷' }, { name: 'France', flag: '🇫🇷' },
  { name: 'Brésil', flag: '🇧🇷' }, { name: 'Angleterre', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { name: 'Espagne', flag: '🇪🇸' }, { name: 'Allemagne', flag: '🇩🇪' },
  { name: 'Portugal', flag: '🇵🇹' }, { name: 'Pays-Bas', flag: '🇳🇱' },
  { name: 'Belgique', flag: '🇧🇪' }, { name: 'Uruguay', flag: '🇺🇾' },
  { name: 'Italie', flag: '🇮🇹' }, { name: 'Mexique', flag: '🇲🇽' },
  { name: 'États-Unis', flag: '🇺🇸' }, { name: 'Canada', flag: '🇨🇦' },
  { name: 'Maroc', flag: '🇲🇦' }, { name: 'Japon', flag: '🇯🇵' },
  { name: 'Croatie', flag: '🇭🇷' }, { name: 'Colombie', flag: '🇨🇴' },
  { name: 'Équateur', flag: '🇪🇨' }, { name: 'Australie', flag: '🇦🇺' },
  { name: 'Sénégal', flag: '🇸🇳' }, { name: 'Danemark', flag: '🇩🇰' },
  { name: 'Suisse', flag: '🇨🇭' }, { name: 'Serbie', flag: '🇷🇸' },
  { name: 'Pologne', flag: '🇵🇱' }, { name: 'Corée du Sud', flag: '🇰🇷' },
  { name: 'Cameroun', flag: '🇨🇲' }, { name: 'Ghana', flag: '🇬🇭' },
  { name: 'Tunisie', flag: '🇹🇳' }, { name: 'Côte d\'Ivoire', flag: '🇨🇮' },
  { name: 'Iran', flag: '🇮🇷' }, { name: 'Arabie Saoudite', flag: '🇸🇦' },
]

const VENUES = [
  'New York/NJ', 'Los Angeles', 'Dallas', 'San Francisco', 'Seattle',
  'Miami', 'Atlanta', 'Boston', 'Houston', 'Kansas City',
  'Philadelphia', 'Vancouver', 'Toronto', 'Guadalajara', 'Mexico City', 'Monterrey',
]

export default function AdminPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'matches' | 'results' | 'bracket'>('matches')
  const [bracketsLocked, setBracketsLocked] = useState<boolean | null>(null)
  const [lockBusy, setLockBusy] = useState(false)

  // New match form
  const [form, setForm] = useState({
    phase: 'groupes' as Phase,
    group_name: '',
    team_home: TEAMS[0].name,
    team_away: TEAMS[1].name,
    kickoff_at: '',
    venue: VENUES[0],
  })

  async function loadMatches() {
    const { data } = await supabase.from('matches').select('*').order('kickoff_at')
    setMatches((data ?? []) as Match[])
    setLoading(false)
  }

  useEffect(() => { loadMatches() }, [])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any).from('app_settings').select('brackets_locked').eq('id', 1).maybeSingle()
      .then(({ data: row }: { data: { brackets_locked: boolean } | null }) => {
        setBracketsLocked(row?.brackets_locked ?? false)
      })
  }, [])

  async function toggleLock() {
    const next = !bracketsLocked
    if (next && !window.confirm('Verrouiller tous les brackets ? Les joueurs ne pourront plus modifier leurs pronostics.')) return
    setLockBusy(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('app_settings')
      .update({ brackets_locked: next, locked_at: next ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
      .eq('id', 1)
    setLockBusy(false)
    if (error) toast.error('Erreur: ' + error.message)
    else { setBracketsLocked(next); toast.success(next ? 'Brackets verrouillés' : 'Brackets déverrouillés') }
  }

  async function addMatch(e: React.FormEvent) {
    e.preventDefault()
    const homeTeam = TEAMS.find(t => t.name === form.team_home)!
    const awayTeam = TEAMS.find(t => t.name === form.team_away)!

    const { error } = await supabase.from('matches').insert({
      phase: form.phase,
      group_name: form.group_name || null,
      team_home: form.team_home,
      team_away: form.team_away,
      flag_home: homeTeam.flag,
      flag_away: awayTeam.flag,
      kickoff_at: form.kickoff_at,
      venue: form.venue,
      is_locked: false,
      score_home: null,
      score_away: null,
    })

    if (error) toast.error('Erreur: ' + error.message)
    else { toast.success('Match ajouté !'); loadMatches() }
  }

  async function setResult(matchId: string, scoreHome: number, scoreAway: number) {
    const match = matches.find(m => m.id === matchId)!
    const phase = match.phase as Phase
    const pts = PHASE_POINTS[phase]

    // Save result
    const { error } = await supabase.from('matches').update({
      score_home: scoreHome,
      score_away: scoreAway,
      is_locked: true,
    }).eq('id', matchId)

    if (error) { toast.error('Erreur résultat'); return }

    // Calculate points for all predictions on this match
    const { data: preds } = await supabase
      .from('predictions')
      .select('*')
      .eq('match_id', matchId)

    if (preds && preds.length > 0) {
      const actualDiff = scoreHome - scoreAway
      const updates = preds.map((p: any) => {
        const predDiff = p.pred_home - p.pred_away
        let points = 0
        if (p.pred_home === scoreHome && p.pred_away === scoreAway) {
          points = pts.result + pts.exact
        } else if (Math.sign(actualDiff) === Math.sign(predDiff)) {
          points = pts.result
        }
        return { id: p.id, points_earned: points }
      })

      for (const u of updates) {
        await supabase.from('predictions').update({ points_earned: u.points_earned }).eq('id', u.id)
      }
    }

    toast.success('Résultat enregistré et points calculés !')
    loadMatches()
  }

  async function deleteMatch(id: string) {
    await supabase.from('matches').delete().eq('id', id)
    toast.success('Match supprimé')
    loadMatches()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Administration</h1>
      </div>

      {/* Verrouillage global des brackets */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-slate-100">
            {bracketsLocked ? '🔒 Brackets verrouillés' : '🔓 Brackets ouverts'}
          </p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
            {bracketsLocked
              ? 'Les joueurs ne peuvent plus modifier leurs pronostics.'
              : 'Les joueurs peuvent encore modifier leurs pronostics. Verrouille au coup d\'envoi.'}
          </p>
        </div>
        <button
          onClick={toggleLock}
          disabled={bracketsLocked === null || lockBusy}
          className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-colors disabled:opacity-50 ${
            bracketsLocked ? 'bg-green-600 hover:bg-green-700' : 'bg-[#c8102e] hover:bg-[#a00d25]'
          }`}
        >
          {lockBusy ? '…' : bracketsLocked ? 'Déverrouiller' : 'Verrouiller les brackets'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['matches', 'results', 'bracket'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              tab === t
                ? t === 'bracket' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700'
            }`}
          >
            {t === 'matches' ? '➕ Matchs' : t === 'results' ? '📋 Scores' : '🏆 Résultats bracket'}
          </button>
        ))}
      </div>

      {tab === 'matches' && (
        <form onSubmit={addMatch} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-4">Nouveau match</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Phase</label>
              <select value={form.phase} onChange={e => setForm(f => ({ ...f, phase: e.target.value as Phase }))} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {PHASES.map(p => <option key={p} value={p}>{PHASE_LABELS[p]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Groupe (optionnel)</label>
              <input type="text" placeholder="A, B, C…" value={form.group_name} onChange={e => setForm(f => ({ ...f, group_name: e.target.value }))} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Équipe domicile</label>
              <select value={form.team_home} onChange={e => setForm(f => ({ ...f, team_home: e.target.value }))} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {TEAMS.map(t => <option key={t.name} value={t.name}>{t.flag} {t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Équipe extérieur</label>
              <select value={form.team_away} onChange={e => setForm(f => ({ ...f, team_away: e.target.value }))} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {TEAMS.map(t => <option key={t.name} value={t.name}>{t.flag} {t.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Date et heure du match</label>
              <input type="datetime-local" value={form.kickoff_at} onChange={e => setForm(f => ({ ...f, kickoff_at: e.target.value }))} required className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Stade / Ville</label>
              <select value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {VENUES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-sm">
            Ajouter le match
          </button>
        </form>
      )}

      {tab === 'results' && (
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : matches.length === 0 ? (
            <p className="text-center text-slate-500 py-16">Aucun match. Commence par en ajouter !</p>
          ) : (
            matches.map(match => (
              <ResultRow key={match.id} match={match} onSave={setResult} onDelete={deleteMatch} />
            ))
          )}
        </div>
      )}

      {tab === 'bracket' && <BracketResultsTab />}
    </div>
  )
}

function AdminGroupCard({ group, qualified, onChange }: { group: string; qualified: [number, number, number]; onChange: (q: [number, number, number]) => void }) {
  const teams = GROUP_TEAMS[group]
  function toggle(idx: number) {
    const [first, second] = qualified
    if (idx === first) return
    if (idx === second) {
      onChange([second, first, -1])
      return
    }
    onChange([first, idx, -1])
  }
  return (
    <div className="border border-gray-200 dark:border-[#3c4043]">
      <div className="px-3 py-2 border-b border-gray-200 dark:border-[#3c4043] bg-gray-50 dark:bg-[#292a2d]">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#5f6368] dark:text-[#9aa0a6]">Groupe {group}</span>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-[#3c4043]">
        {teams.map((team: Team, idx: number) => {
          const rank = idx === qualified[0] ? 1 : idx === qualified[1] ? 2 : null
          return (
            <button key={idx} onClick={() => toggle(idx)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] text-left transition-colors
                ${rank === 1 ? 'bg-green-600 text-white font-semibold' : rank === 2 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium' : 'bg-white dark:bg-[#202124] text-gray-700 dark:text-[#bdc1c6] hover:bg-gray-50 dark:hover:bg-[#292a2d]'}`}
            >
              <span className="text-sm">{team.flag}</span>
              <span className="flex-1 truncate">{team.name}</span>
              {rank && <span className="text-[11px] font-bold ml-auto">{rank}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function AdminMatchBox({ label, team1, team2, winner, onPick }: { label?: string; team1: { name: string; flag: string } | null; team2: { name: string; flag: string } | null; winner: 0 | 1 | null; onPick: (side: 0 | 1) => void }) {
  const canPick = team1 && team2
  return (
    <div className="flex flex-col min-w-[164px]">
      {label && <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] mb-1.5 font-medium">{label}</p>}
      <div className="border border-gray-200 dark:border-[#3c4043] divide-y divide-gray-200 dark:divide-[#3c4043]">
        {([team1, team2] as const).map((team, side) => (
          team ? (
            <button key={side} onClick={() => canPick && onPick(side as 0 | 1)} disabled={!canPick}
              className={`flex items-center gap-2 px-3 py-2 text-[13px] font-medium transition-colors w-full text-left
                ${winner === side ? 'bg-green-600 text-white' : canPick ? 'bg-white dark:bg-[#292a2d] text-gray-900 dark:text-[#e8eaed] hover:bg-gray-50 dark:hover:bg-[#35363a] cursor-pointer' : 'bg-white dark:bg-[#292a2d] text-[#5f6368] dark:text-[#9aa0a6] cursor-default'}`}
            >
              <span>{team.flag}</span>
              <span className="flex-1 truncate">{team.name}</span>
              {winner === side && <span className="text-[11px] ml-auto">✓</span>}
            </button>
          ) : (
            <div key={side} className="flex items-center gap-2 px-3 py-2 text-[#5f6368] dark:text-[#9aa0a6] text-[13px] italic">
              <span>À déterminer</span>
            </div>
          )
        ))}
      </div>
    </div>
  )
}

function BracketResultsTab() {
  const [bracketTab, setBracketTab] = useState('groupes')
  const [data, setData] = useState<BracketData>(() => DEFAULT_DATA)
  const [rowId, setRowId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any)
      .from('tournament_results')
      .select('id, data')
      .limit(1)
      .maybeSingle()
      .then(({ data: row }: { data: { id: string; data: unknown } | null }) => {
        if (row) { setRowId(row.id); setData(migrateData(row.data)) }
        setLoaded(true)
      })
  }, [])

  function update(fn: (d: BracketData) => BracketData) { setData(prev => fn({ ...prev })); setDirty(true) }

  function setGroupQualified(group: string, q: [number, number, number]) {
    update(d => ({ ...d, groupQualified: { ...d.groupQualified, [group]: q }, r32: Array(16).fill(null), r16: Array(8).fill(null), quarters: Array(4).fill(null), semis: Array(2).fill(null), final: null, thirdPlace: null }))
  }
  function pickR32(i: number, side: 0 | 1) {
    update(d => { const r = [...d.r32] as (0|1|null)[]; r[i] = side; return { ...d, r32: r, r16: Array(8).fill(null), quarters: Array(4).fill(null), semis: Array(2).fill(null), final: null, thirdPlace: null } })
  }
  function pickR16(i: number, side: 0 | 1) {
    update(d => { const r = [...d.r16] as (0|1|null)[]; r[i] = side; return { ...d, r16: r, quarters: Array(4).fill(null), semis: Array(2).fill(null), final: null, thirdPlace: null } })
  }
  function pickQuarter(i: number, side: 0 | 1) {
    update(d => { const q = [...d.quarters] as (0|1|null)[]; q[i] = side; return { ...d, quarters: q, semis: Array(2).fill(null), final: null, thirdPlace: null } })
  }
  function pickSemi(i: number, side: 0 | 1) {
    update(d => { const s = [...d.semis] as (0|1|null)[]; s[i] = side; return { ...d, semis: s, final: null, thirdPlace: null } })
  }
  function pickFinal(side: 0 | 1) { update(d => ({ ...d, final: side })) }
  function pickThirdPlace(side: 0 | 1) { update(d => ({ ...d, thirdPlace: side })) }

  async function save() {
    setSaving(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let error: any = null
    if (rowId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await (supabase as any).from('tournament_results').update({ data, updated_at: new Date().toISOString() }).eq('id', rowId)
      error = res.error
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await (supabase as any).from('tournament_results').insert({ data }).select('id').single()
      error = res.error
      if (!error && res.data?.id) setRowId(res.data.id)
    }
    setSaving(false)
    if (error) toast.error('Erreur: ' + error.message)
    else { toast.success('Résultats sauvegardés !'); setDirty(false) }
  }

  const champion = getChampion(data)
  const loser0 = getSemiLoser(data, 0)
  const loser1 = getSemiLoser(data, 1)

  if (!loaded) return <div className="flex items-center justify-center h-32"><div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <p className="text-[13px] text-[#5f6368] dark:text-[#9aa0a6] mb-4">
        Saisis les vrais résultats du tournoi après chaque phase. Ces données alimentent le classement.
      </p>
      <div className="border-b border-gray-200 dark:border-[#3c4043] flex items-end gap-0 overflow-x-auto mb-4">
        {[{ id: 'groupes', label: 'Groupes' }, { id: 'seiziemes', label: 'S16' }, { id: 'huitiemes', label: '1/8' }, { id: 'quarts', label: 'Quarts' }, { id: 'demis', label: 'Demi-finales' }, { id: 'finale', label: 'Finale' }].map(t => (
          <button key={t.id} onClick={() => setBracketTab(t.id)}
            className={`relative px-4 pb-3 pt-1 text-[13px] font-medium whitespace-nowrap transition-colors ${bracketTab === t.id ? 'text-green-600 dark:text-green-400' : 'text-[#5f6368] dark:text-[#9aa0a6] hover:text-gray-800'}`}
          >
            {t.label}
            {bracketTab === t.id && <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-green-600 dark:bg-green-400" />}
          </button>
        ))}
        <div className="ml-auto pb-2 shrink-0">
          <button onClick={save} disabled={!dirty || saving}
            className={`text-[13px] font-medium px-3 py-1.5 transition-colors ${dirty ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-gray-400 cursor-default'}`}
          >
            {saving ? 'Enregistrement…' : dirty ? 'Enregistrer' : 'Enregistré'}
          </button>
        </div>
      </div>

      {bracketTab === 'groupes' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-gray-200 dark:bg-[#3c4043]">
          {GROUPS.map((g: string) => <div key={g} className="bg-white dark:bg-[#202124]"><AdminGroupCard group={g} qualified={data.groupQualified[g] as [number, number, number]} onChange={q => setGroupQualified(g, q)} /></div>)}
        </div>
      )}
      {bracketTab === 'seiziemes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
            {([0,2,3,5,10,11,13,15] as const).map(i => {
              const m = R32_MATCHES[i] as R32GroupMatch
              const labels = ['M73','M74','M75','M76','M77','M78','M79','M80','M81','M82','M83','M84','M85','M86','M87','M88']
              return <AdminMatchBox key={i} label={`${labels[i]} ${m.t1.rank === 1 ? '1' : '2'}${m.t1.g}v${m.t2.rank === 1 ? '1' : '2'}${m.t2.g}`} team1={getR32Team(data, i, 0)} team2={getR32Team(data, i, 1)} winner={data.r32[i]} onPick={side => pickR32(i, side)} />
            })}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
            {([1,4,6,7,8,9,12,14] as const).map(i => {
              const tm = R32_MATCHES[i] as R32ThirdMatch
              const labels = ['M73','M74','M75','M76','M77','M78','M79','M80','M81','M82','M83','M84','M85','M86','M87','M88']
              return <AdminMatchBox key={i} label={`${labels[i]} 1er${tm.host.g} vs 3e`} team1={getR32Team(data, i, 0)} team2={getR32Team(data, i, 1)} winner={data.r32[i]} onPick={side => pickR32(i, side)} />
            })}
          </div>
        </div>
      )}
      {bracketTab === 'huitiemes' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-6">
          {Array.from({ length: 8 }, (_, i) => <AdminMatchBox key={i} label={`1/8-${i + 1}`} team1={getR16Team(data, i, 0)} team2={getR16Team(data, i, 1)} winner={data.r16[i]} onPick={side => pickR16(i, side)} />)}
        </div>
      )}
      {bracketTab === 'quarts' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-6">
          {Array.from({ length: 4 }, (_, i) => <AdminMatchBox key={i} label={`Quart ${i + 1}`} team1={getQuarterTeam(data, i, 0)} team2={getQuarterTeam(data, i, 1)} winner={data.quarters[i]} onPick={side => pickQuarter(i, side)} />)}
        </div>
      )}
      {bracketTab === 'demis' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-6">
            {Array.from({ length: 2 }, (_, i) => <AdminMatchBox key={i} label={`Demi-finale ${i + 1}`} team1={getSemiTeam(data, i, 0)} team2={getSemiTeam(data, i, 1)} winner={data.semis[i]} onPick={side => pickSemi(i, side)} />)}
          </div>
          {loser0 && loser1 && <div><p className="text-[11px] text-[#5f6368] uppercase tracking-wide font-medium mb-3">3e place</p><AdminMatchBox team1={loser0} team2={loser1} winner={data.thirdPlace} onPick={side => pickThirdPlace(side)} /></div>}
        </div>
      )}
      {bracketTab === 'finale' && (
        <div className="flex flex-col gap-6">
          <AdminMatchBox label="Finale · 19 juillet 2026" team1={getFinalTeam(data, 0)} team2={getFinalTeam(data, 1)} winner={data.final} onPick={side => pickFinal(side)} />
          {champion && <div className="border-l-[3px] border-green-600 dark:border-green-400 pl-4 py-1"><p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium mb-1">Champion officiel 2026</p><p className="text-[22px] font-medium text-gray-900 dark:text-[#e8eaed]">{champion.flag} {champion.name}</p></div>}
        </div>
      )}
    </div>
  )
}

function ResultRow({ match, onSave, onDelete }: {
  match: Match
  onSave: (id: string, h: number, a: number) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [home, setHome] = useState(match.score_home ?? 0)
  const [away, setAway] = useState(match.score_away ?? 0)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(match.id, home, away)
    setSaving(false)
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">
          {PHASE_LABELS[match.phase as Phase]} · {format(new Date(match.kickoff_at), 'd MMM HH:mm', { locale: fr })}
        </div>
        <div className="text-sm font-medium text-gray-900 dark:text-slate-100">
          {match.flag_home} {match.team_home} vs {match.team_away} {match.flag_away}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={99}
          value={home}
          onChange={e => setHome(Number(e.target.value))}
          className="w-12 h-9 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-center text-gray-900 dark:text-slate-100 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-gray-400 dark:text-slate-500">—</span>
        <input
          type="number"
          min={0}
          max={99}
          value={away}
          onChange={e => setAway(Number(e.target.value))}
          className="w-12 h-9 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-center text-gray-900 dark:text-slate-100 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {match.score_home !== null ? 'Modifier' : 'Valider'}
        </button>
        <button
          onClick={() => onDelete(match.id)}
          className="px-2 py-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
        >
          ✕
        </button>
      </div>

      {match.is_locked && (
        <span className="w-full text-xs text-gray-400 dark:text-slate-500">🔒 Résultat enregistré</span>
      )}
    </div>
  )
}
