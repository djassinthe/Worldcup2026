import { useState, useEffect } from 'react'
import React from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import type { Match, Phase } from '../types'
import { PHASE_LABELS, PHASE_POINTS } from '../types'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const PHASES: Phase[] = ['groupes', 'huitiemes', 'quarts', 'demis', 'finale']

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
  const [tab, setTab] = useState<'matches' | 'results'>('matches')

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

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['matches', 'results'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              tab === t
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700'
            }`}
          >
            {t === 'matches' ? '➕ Ajouter un match' : '📋 Saisir les résultats'}
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
