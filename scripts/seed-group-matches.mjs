/**
 * Script d'insertion des 72 matchs de la phase de groupes — Coupe du Monde 2026
 * Usage: VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... node scripts/seed-group-matches.mjs
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variables manquantes. Lancer avec :')
  console.error('   VITE_SUPABASE_URL=https://xxx.supabase.co VITE_SUPABASE_ANON_KEY=eyJ... node scripts/seed-group-matches.mjs')
  process.exit(1)
}

const matches = [
  // ===================== GROUPE A =====================
  { phase:'groupes', group_name:'A', team_home:'Mexique',        flag_home:'🇲🇽', team_away:'Afrique du Sud',    flag_away:'🇿🇦', kickoff_at:'2026-06-11T19:00:00Z', venue:'Mexico City' },
  { phase:'groupes', group_name:'A', team_home:'Corée du Sud',   flag_home:'🇰🇷', team_away:'Tchéquie',          flag_away:'🇨🇿', kickoff_at:'2026-06-12T02:00:00Z', venue:'Guadalajara' },
  { phase:'groupes', group_name:'A', team_home:'Tchéquie',       flag_home:'🇨🇿', team_away:'Afrique du Sud',    flag_away:'🇿🇦', kickoff_at:'2026-06-18T16:00:00Z', venue:'Atlanta' },
  { phase:'groupes', group_name:'A', team_home:'Mexique',        flag_home:'🇲🇽', team_away:'Corée du Sud',      flag_away:'🇰🇷', kickoff_at:'2026-06-19T01:00:00Z', venue:'Guadalajara' },
  { phase:'groupes', group_name:'A', team_home:'Tchéquie',       flag_home:'🇨🇿', team_away:'Mexique',           flag_away:'🇲🇽', kickoff_at:'2026-06-25T01:00:00Z', venue:'Mexico City' },
  { phase:'groupes', group_name:'A', team_home:'Afrique du Sud', flag_home:'🇿🇦', team_away:'Corée du Sud',      flag_away:'🇰🇷', kickoff_at:'2026-06-25T01:00:00Z', venue:'Monterrey' },

  // ===================== GROUPE B =====================
  { phase:'groupes', group_name:'B', team_home:'Canada',          flag_home:'🇨🇦', team_away:'Bosnie-Herzégovine', flag_away:'🇧🇦', kickoff_at:'2026-06-12T19:00:00Z', venue:'Toronto' },
  { phase:'groupes', group_name:'B', team_home:'Qatar',            flag_home:'🇶🇦', team_away:'Suisse',             flag_away:'🇨🇭', kickoff_at:'2026-06-13T19:00:00Z', venue:'San Francisco' },
  { phase:'groupes', group_name:'B', team_home:'Suisse',           flag_home:'🇨🇭', team_away:'Bosnie-Herzégovine', flag_away:'🇧🇦', kickoff_at:'2026-06-18T19:00:00Z', venue:'Los Angeles' },
  { phase:'groupes', group_name:'B', team_home:'Canada',           flag_home:'🇨🇦', team_away:'Qatar',              flag_away:'🇶🇦', kickoff_at:'2026-06-18T22:00:00Z', venue:'Vancouver' },
  { phase:'groupes', group_name:'B', team_home:'Suisse',           flag_home:'🇨🇭', team_away:'Canada',             flag_away:'🇨🇦', kickoff_at:'2026-06-24T19:00:00Z', venue:'Vancouver' },
  { phase:'groupes', group_name:'B', team_home:'Bosnie-Herzégovine', flag_home:'🇧🇦', team_away:'Qatar',            flag_away:'🇶🇦', kickoff_at:'2026-06-24T19:00:00Z', venue:'Seattle' },

  // ===================== GROUPE C =====================
  { phase:'groupes', group_name:'C', team_home:'Brésil',   flag_home:'🇧🇷', team_away:'Maroc',    flag_away:'🇲🇦', kickoff_at:'2026-06-13T22:00:00Z', venue:'New York/NJ' },
  { phase:'groupes', group_name:'C', team_home:'Haïti',    flag_home:'🇭🇹', team_away:'Écosse',   flag_away:'🏴󠁧󠁢󠁳󠁣󠁴󠁿', kickoff_at:'2026-06-14T01:00:00Z', venue:'Boston' },
  { phase:'groupes', group_name:'C', team_home:'Écosse',   flag_home:'🏴󠁧󠁢󠁳󠁣󠁴󠁿', team_away:'Maroc',    flag_away:'🇲🇦', kickoff_at:'2026-06-19T22:00:00Z', venue:'Boston' },
  { phase:'groupes', group_name:'C', team_home:'Brésil',   flag_home:'🇧🇷', team_away:'Haïti',    flag_away:'🇭🇹', kickoff_at:'2026-06-20T00:30:00Z', venue:'Philadelphia' },
  { phase:'groupes', group_name:'C', team_home:'Écosse',   flag_home:'🏴󠁧󠁢󠁳󠁣󠁴󠁿', team_away:'Brésil',   flag_away:'🇧🇷', kickoff_at:'2026-06-24T22:00:00Z', venue:'Miami' },
  { phase:'groupes', group_name:'C', team_home:'Maroc',    flag_home:'🇲🇦', team_away:'Haïti',    flag_away:'🇭🇹', kickoff_at:'2026-06-24T22:00:00Z', venue:'Atlanta' },

  // ===================== GROUPE D =====================
  { phase:'groupes', group_name:'D', team_home:'États-Unis', flag_home:'🇺🇸', team_away:'Paraguay',  flag_away:'🇵🇾', kickoff_at:'2026-06-13T01:00:00Z', venue:'Los Angeles' },
  { phase:'groupes', group_name:'D', team_home:'Australie',  flag_home:'🇦🇺', team_away:'Turquie',   flag_away:'🇹🇷', kickoff_at:'2026-06-14T04:00:00Z', venue:'Vancouver' },
  { phase:'groupes', group_name:'D', team_home:'États-Unis', flag_home:'🇺🇸', team_away:'Australie', flag_away:'🇦🇺', kickoff_at:'2026-06-19T19:00:00Z', venue:'Seattle' },
  { phase:'groupes', group_name:'D', team_home:'Turquie',    flag_home:'🇹🇷', team_away:'Paraguay',  flag_away:'🇵🇾', kickoff_at:'2026-06-20T03:00:00Z', venue:'San Francisco' },
  { phase:'groupes', group_name:'D', team_home:'Turquie',    flag_home:'🇹🇷', team_away:'États-Unis', flag_away:'🇺🇸', kickoff_at:'2026-06-26T02:00:00Z', venue:'Los Angeles' },
  { phase:'groupes', group_name:'D', team_home:'Paraguay',   flag_home:'🇵🇾', team_away:'Australie', flag_away:'🇦🇺', kickoff_at:'2026-06-26T02:00:00Z', venue:'San Francisco' },

  // ===================== GROUPE E =====================
  { phase:'groupes', group_name:'E', team_home:'Allemagne',      flag_home:'🇩🇪', team_away:"Curaçao",       flag_away:'🇨🇼', kickoff_at:'2026-06-14T17:00:00Z', venue:'Houston' },
  { phase:'groupes', group_name:'E', team_home:"Côte d'Ivoire",  flag_home:'🇨🇮', team_away:'Équateur',      flag_away:'🇪🇨', kickoff_at:'2026-06-14T23:00:00Z', venue:'Philadelphia' },
  { phase:'groupes', group_name:'E', team_home:'Allemagne',      flag_home:'🇩🇪', team_away:"Côte d'Ivoire", flag_away:'🇨🇮', kickoff_at:'2026-06-20T20:00:00Z', venue:'Toronto' },
  { phase:'groupes', group_name:'E', team_home:'Équateur',       flag_home:'🇪🇨', team_away:"Curaçao",       flag_away:'🇨🇼', kickoff_at:'2026-06-21T00:00:00Z', venue:'Kansas City' },
  { phase:'groupes', group_name:'E', team_home:"Curaçao",        flag_home:'🇨🇼', team_away:"Côte d'Ivoire", flag_away:'🇨🇮', kickoff_at:'2026-06-25T20:00:00Z', venue:'Philadelphia' },
  { phase:'groupes', group_name:'E', team_home:'Équateur',       flag_home:'🇪🇨', team_away:'Allemagne',     flag_away:'🇩🇪', kickoff_at:'2026-06-25T20:00:00Z', venue:'New York/NJ' },

  // ===================== GROUPE F =====================
  { phase:'groupes', group_name:'F', team_home:'Pays-Bas', flag_home:'🇳🇱', team_away:'Japon',   flag_away:'🇯🇵', kickoff_at:'2026-06-14T20:00:00Z', venue:'Dallas' },
  { phase:'groupes', group_name:'F', team_home:'Suède',    flag_home:'🇸🇪', team_away:'Tunisie', flag_away:'🇹🇳', kickoff_at:'2026-06-15T02:00:00Z', venue:'Monterrey' },
  { phase:'groupes', group_name:'F', team_home:'Pays-Bas', flag_home:'🇳🇱', team_away:'Suède',   flag_away:'🇸🇪', kickoff_at:'2026-06-20T17:00:00Z', venue:'Houston' },
  { phase:'groupes', group_name:'F', team_home:'Tunisie',  flag_home:'🇹🇳', team_away:'Japon',   flag_away:'🇯🇵', kickoff_at:'2026-06-21T04:00:00Z', venue:'Monterrey' },
  { phase:'groupes', group_name:'F', team_home:'Japon',    flag_home:'🇯🇵', team_away:'Suède',   flag_away:'🇸🇪', kickoff_at:'2026-06-25T23:00:00Z', venue:'Monterrey' },
  { phase:'groupes', group_name:'F', team_home:'Tunisie',  flag_home:'🇹🇳', team_away:'Pays-Bas', flag_away:'🇳🇱', kickoff_at:'2026-06-25T23:00:00Z', venue:'Dallas' },

  // ===================== GROUPE G =====================
  { phase:'groupes', group_name:'G', team_home:'Belgique',       flag_home:'🇧🇪', team_away:'Égypte',          flag_away:'🇪🇬', kickoff_at:'2026-06-15T19:00:00Z', venue:'Seattle' },
  { phase:'groupes', group_name:'G', team_home:'Iran',           flag_home:'🇮🇷', team_away:'Nouvelle-Zélande', flag_away:'🇳🇿', kickoff_at:'2026-06-16T01:00:00Z', venue:'Los Angeles' },
  { phase:'groupes', group_name:'G', team_home:'Belgique',       flag_home:'🇧🇪', team_away:'Iran',             flag_away:'🇮🇷', kickoff_at:'2026-06-21T19:00:00Z', venue:'Los Angeles' },
  { phase:'groupes', group_name:'G', team_home:'Nouvelle-Zélande', flag_home:'🇳🇿', team_away:'Égypte',         flag_away:'🇪🇬', kickoff_at:'2026-06-22T01:00:00Z', venue:'Vancouver' },
  { phase:'groupes', group_name:'G', team_home:'Égypte',         flag_home:'🇪🇬', team_away:'Iran',             flag_away:'🇮🇷', kickoff_at:'2026-06-27T03:00:00Z', venue:'Vancouver' },
  { phase:'groupes', group_name:'G', team_home:'Nouvelle-Zélande', flag_home:'🇳🇿', team_away:'Belgique',       flag_away:'🇧🇪', kickoff_at:'2026-06-27T03:00:00Z', venue:'Seattle' },

  // ===================== GROUPE H =====================
  { phase:'groupes', group_name:'H', team_home:'Espagne',       flag_home:'🇪🇸', team_away:'Cap-Vert',     flag_away:'🇨🇻', kickoff_at:'2026-06-15T16:00:00Z', venue:'Atlanta' },
  { phase:'groupes', group_name:'H', team_home:'Arabie Saoudite', flag_home:'🇸🇦', team_away:'Uruguay',    flag_away:'🇺🇾', kickoff_at:'2026-06-15T22:00:00Z', venue:'Miami' },
  { phase:'groupes', group_name:'H', team_home:'Espagne',       flag_home:'🇪🇸', team_away:'Arabie Saoudite', flag_away:'🇸🇦', kickoff_at:'2026-06-21T16:00:00Z', venue:'Atlanta' },
  { phase:'groupes', group_name:'H', team_home:'Uruguay',       flag_home:'🇺🇾', team_away:'Cap-Vert',     flag_away:'🇨🇻', kickoff_at:'2026-06-21T22:00:00Z', venue:'Miami' },
  { phase:'groupes', group_name:'H', team_home:'Cap-Vert',      flag_home:'🇨🇻', team_away:'Arabie Saoudite', flag_away:'🇸🇦', kickoff_at:'2026-06-27T00:00:00Z', venue:'Houston' },
  { phase:'groupes', group_name:'H', team_home:'Uruguay',       flag_home:'🇺🇾', team_away:'Espagne',      flag_away:'🇪🇸', kickoff_at:'2026-06-27T00:00:00Z', venue:'Houston' },

  // ===================== GROUPE I =====================
  { phase:'groupes', group_name:'I', team_home:'France',  flag_home:'🇫🇷', team_away:'Sénégal', flag_away:'🇸🇳', kickoff_at:'2026-06-16T19:00:00Z', venue:'New York/NJ' },
  { phase:'groupes', group_name:'I', team_home:'Irak',    flag_home:'🇮🇶', team_away:'Norvège', flag_away:'🇳🇴', kickoff_at:'2026-06-16T22:00:00Z', venue:'Boston' },
  { phase:'groupes', group_name:'I', team_home:'France',  flag_home:'🇫🇷', team_away:'Irak',    flag_away:'🇮🇶', kickoff_at:'2026-06-22T21:00:00Z', venue:'Philadelphia' },
  { phase:'groupes', group_name:'I', team_home:'Norvège', flag_home:'🇳🇴', team_away:'Sénégal', flag_away:'🇸🇳', kickoff_at:'2026-06-23T00:00:00Z', venue:'New York/NJ' },
  { phase:'groupes', group_name:'I', team_home:'Norvège', flag_home:'🇳🇴', team_away:'France',  flag_away:'🇫🇷', kickoff_at:'2026-06-26T19:00:00Z', venue:'Boston' },
  { phase:'groupes', group_name:'I', team_home:'Sénégal', flag_home:'🇸🇳', team_away:'Irak',    flag_away:'🇮🇶', kickoff_at:'2026-06-26T19:00:00Z', venue:'Toronto' },

  // ===================== GROUPE J =====================
  { phase:'groupes', group_name:'J', team_home:'Argentine', flag_home:'🇦🇷', team_away:'Algérie',  flag_away:'🇩🇿', kickoff_at:'2026-06-17T01:00:00Z', venue:'Kansas City' },
  { phase:'groupes', group_name:'J', team_home:'Autriche',  flag_home:'🇦🇹', team_away:'Jordanie', flag_away:'🇯🇴', kickoff_at:'2026-06-17T04:00:00Z', venue:'San Francisco' },
  { phase:'groupes', group_name:'J', team_home:'Argentine', flag_home:'🇦🇷', team_away:'Autriche', flag_away:'🇦🇹', kickoff_at:'2026-06-22T17:00:00Z', venue:'Dallas' },
  { phase:'groupes', group_name:'J', team_home:'Jordanie',  flag_home:'🇯🇴', team_away:'Algérie',  flag_away:'🇩🇿', kickoff_at:'2026-06-23T03:00:00Z', venue:'Dallas' },
  { phase:'groupes', group_name:'J', team_home:'Algérie',   flag_home:'🇩🇿', team_away:'Autriche', flag_away:'🇦🇹', kickoff_at:'2026-06-28T02:00:00Z', venue:'Dallas' },
  { phase:'groupes', group_name:'J', team_home:'Jordanie',  flag_home:'🇯🇴', team_away:'Argentine', flag_away:'🇦🇷', kickoff_at:'2026-06-28T02:00:00Z', venue:'Kansas City' },

  // ===================== GROUPE K =====================
  { phase:'groupes', group_name:'K', team_home:'Portugal',     flag_home:'🇵🇹', team_away:'RD Congo',    flag_away:'🇨🇩', kickoff_at:'2026-06-17T17:00:00Z', venue:'Houston' },
  { phase:'groupes', group_name:'K', team_home:'Ouzbékistan',  flag_home:'🇺🇿', team_away:'Colombie',    flag_away:'🇨🇴', kickoff_at:'2026-06-18T02:00:00Z', venue:'Mexico City' },
  { phase:'groupes', group_name:'K', team_home:'Portugal',     flag_home:'🇵🇹', team_away:'Ouzbékistan', flag_away:'🇺🇿', kickoff_at:'2026-06-23T17:00:00Z', venue:'Houston' },
  { phase:'groupes', group_name:'K', team_home:'Colombie',     flag_home:'🇨🇴', team_away:'RD Congo',    flag_away:'🇨🇩', kickoff_at:'2026-06-24T02:00:00Z', venue:'Mexico City' },
  { phase:'groupes', group_name:'K', team_home:'Colombie',     flag_home:'🇨🇴', team_away:'Portugal',    flag_away:'🇵🇹', kickoff_at:'2026-06-27T23:30:00Z', venue:'Miami' },
  { phase:'groupes', group_name:'K', team_home:'RD Congo',     flag_home:'🇨🇩', team_away:'Ouzbékistan', flag_away:'🇺🇿', kickoff_at:'2026-06-27T23:30:00Z', venue:'Atlanta' },

  // ===================== GROUPE L =====================
  { phase:'groupes', group_name:'L', team_home:'Angleterre', flag_home:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', team_away:'Croatie', flag_away:'🇭🇷', kickoff_at:'2026-06-17T20:00:00Z', venue:'Dallas' },
  { phase:'groupes', group_name:'L', team_home:'Ghana',      flag_home:'🇬🇭', team_away:'Panama',  flag_away:'🇵🇦', kickoff_at:'2026-06-17T23:00:00Z', venue:'Toronto' },
  { phase:'groupes', group_name:'L', team_home:'Angleterre', flag_home:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', team_away:'Ghana',   flag_away:'🇬🇭', kickoff_at:'2026-06-23T20:00:00Z', venue:'Boston' },
  { phase:'groupes', group_name:'L', team_home:'Panama',     flag_home:'🇵🇦', team_away:'Croatie', flag_away:'🇭🇷', kickoff_at:'2026-06-23T23:00:00Z', venue:'Boston' },
  { phase:'groupes', group_name:'L', team_home:'Panama',     flag_home:'🇵🇦', team_away:'Angleterre', flag_away:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', kickoff_at:'2026-06-27T21:00:00Z', venue:'New York/NJ' },
  { phase:'groupes', group_name:'L', team_home:'Croatie',    flag_home:'🇭🇷', team_away:'Ghana',   flag_away:'🇬🇭', kickoff_at:'2026-06-27T21:00:00Z', venue:'Philadelphia' },
]

// Add default fields
const payload = matches.map(m => ({
  ...m,
  is_locked: false,
  score_home: null,
  score_away: null,
}))

console.log(`📦 Insertion de ${payload.length} matchs...`)

const res = await fetch(`${SUPABASE_URL}/rest/v1/matches`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Prefer': 'return=minimal',
  },
  body: JSON.stringify(payload),
})

if (res.ok) {
  console.log(`✅ ${payload.length} matchs insérés avec succès !`)
} else {
  const err = await res.text()
  console.error('❌ Erreur:', res.status, err)
}
