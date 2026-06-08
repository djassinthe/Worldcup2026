/**
 * Supprime un joueur et ses pronostics de la base.
 * Usage: VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... node scripts/delete-player.mjs <pseudo>
 * Exemple: VITE_SUPABASE_URL=https://xxx.supabase.co VITE_SUPABASE_ANON_KEY=eyJ... node scripts/delete-player.mjs QATester
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY
const pseudo = process.argv[2]

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variables manquantes. Lancer avec :')
  console.error('   VITE_SUPABASE_URL=https://xxx.supabase.co VITE_SUPABASE_ANON_KEY=eyJ... node scripts/delete-player.mjs <pseudo>')
  process.exit(1)
}
if (!pseudo) {
  console.error('❌ Pseudo manquant. Exemple : node scripts/delete-player.mjs QATester')
  process.exit(1)
}

async function del(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
  })
  return res
}

async function get(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  })
  return res.json()
}

// 1. Trouver le joueur
const players = await get(`players?pseudo=eq.${encodeURIComponent(pseudo)}&select=id,pseudo`)
if (!players.length) {
  console.error(`❌ Joueur "${pseudo}" introuvable.`)
  process.exit(1)
}
const player = players[0]
console.log(`✅ Joueur trouvé : ${player.pseudo} (id: ${player.id})`)

// 2. Supprimer le bracket
const r1 = await del(`bracket_predictions?player_id=eq.${player.id}`)
console.log(`🗑  bracket_predictions supprimé (status ${r1.status})`)

// 3. Supprimer le joueur
const r2 = await del(`players?id=eq.${player.id}`)
console.log(`🗑  players supprimé (status ${r2.status})`)

console.log(`✅ Compte "${pseudo}" supprimé avec succès.`)
