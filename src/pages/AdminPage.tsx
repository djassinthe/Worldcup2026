import { useState, useEffect } from 'react'
import React from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import type { Match, Phase } from '../types'
import { PHASE_LABELS, PHASE_POINTS } from '../types'
import { Navigate } from 'react-router-dom'
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
  const { isAdmin } = useAuth()
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

  if (!isAdmin) return <Navigate to="/matchs" replace />

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
      <div className="flex items-center gap-3 mb-8">
        <span className="text-3xl">🛡️</span>
        <h1 className="font-heading text-4xl text-purple-400 tracking-wider">ADMIN</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['matches', 'results'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              tab === t
                ? 'bg-purple-600 text-white'
                : 'bg-[#111e35] text-slate-400 border border-[#1e3a5f]'
            }`}
          >
            {t === 'matches' ? '➕ Ajouter un match' : '📋 Saisir les résultats'}
          </button>
        ))}
      </div>

      {tab === 'matches' && (
        <form onSubmit={addMatch} className="bg-[#111e35] border border-[#1e3a5f] rounded-2xl p-6 space-y-4">
          <h2 className="font-heading text-xl text-white tracking-wider mb-4">NOUVEAU MATCH</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phase</label>
              <select value={form.phase} onChange={e => setForm(f => ({ ...f, phase: e.target.value as Phase }))} className="field">
                {PHASES.map(p => <option key={p} value={p}>{PHASE_LABELS[p]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Groupe (optionnel)</label>
              <input type="text" placeholder="A, B, C…" value={form.group_name} onChange={e => setForm(f => ({ ...f, group_name: e.target.value }))} className="field" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Équipe domicile</label>
              <select value={form.team_home} onChange={e => setForm(f => ({ ...f, team_home: e.target.value }))} className="field">
                {TEAMS.map(t => <option key={t.name} value={t.name}>{t.flag} {t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Équipe extérieur</label>
              <select value={form.team_away} onChange={e => setForm(f => ({ ...f, team_away: e.target.value }))} className="field">
                {TEAMS.map(t => <option key={t.name} value={t.name}>{t.flag} {t.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date et heure du match</label>
              <input type="datetime-local" value={form.kickoff_at} onChange={e => setForm(f => ({ ...f, kickoff_at: e.target.value }))} required className="field" />
            </div>
            <div>
              <label className="label">Stade / Ville</label>
              <select value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} className="field">
                {VENUES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 transition-colors font-heading text-lg tracking-wider">
            AJOUTER LE MATCH
          </button>
        </form>
      )}

      {tab === 'results' && (
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
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
    <div className="bg-[#111e35] border border-[#1e3a5f] rounded-xl p-4 flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-500 mb-0.5">
          {PHASE_LABELS[match.phase as Phase]} · {format(new Date(match.kickoff_at), 'd MMM HH:mm', { locale: fr })}
        </div>
        <div className="text-sm font-medium text-white">
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
          className="w-12 h-9 bg-[#0a1628] border border-[#1e3a5f] rounded-lg text-center text-white font-heading text-lg focus:outline-none focus:border-purple-500"
        />
        <span className="text-slate-500">—</span>
        <input
          type="number"
          min={0}
          max={99}
          value={away}
          onChange={e => setAway(Number(e.target.value))}
          className="w-12 h-9 bg-[#0a1628] border border-[#1e3a5f] rounded-lg text-center text-white font-heading text-lg focus:outline-none focus:border-purple-500"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1.5 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-500 disabled:opacity-50 transition-colors"
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
        <span className="w-full text-xs text-slate-500">🔒 Résultat enregistré</span>
      )}
    </div>
  )
}
