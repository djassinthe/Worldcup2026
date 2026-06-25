export type Phase =
  | 'groupes'
  | 'seiziemes'
  | 'huitiemes'
  | 'quarts'
  | 'demis'
  | 'finale'

export interface Player {
  id: string
  pseudo: string
  joined_at: string
}

export interface Match {
  id: string
  phase: Phase
  group_name: string | null
  team_home: string
  team_away: string
  flag_home: string
  flag_away: string
  score_home: number | null
  score_away: number | null
  kickoff_at: string
  is_locked: boolean
  venue: string | null
}

export const PHASE_LABELS: Record<Phase, string> = {
  groupes: 'Phase de groupes',
  seiziemes: 'Seizièmes de finale',
  huitiemes: 'Huitièmes de finale',
  quarts: 'Quarts de finale',
  demis: 'Demi-finales',
  finale: 'Finale',
}

export const PHASE_POINTS: Record<Phase, { result: number; exact: number }> = {
  groupes:   { result: 2,  exact: 3 },
  seiziemes: { result: 2,  exact: 3 },
  huitiemes: { result: 3,  exact: 4 },
  quarts:    { result: 4,  exact: 5 },
  demis:     { result: 6,  exact: 6 },
  finale:    { result: 10, exact: 10 },
}
