import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Player } from '../types'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  player: Player | null
  isAdmin: boolean
  login: (pseudo: string, code: string) => Promise<{ error?: string }>
  loginAdmin: (adminCode: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const FAMILY_CODE = import.meta.env.VITE_FAMILY_CODE || 'LACOUPE2026'
const ADMIN_CODE = import.meta.env.VITE_ADMIN_CODE || 'ADMIN_SECRET_2026'
const STORAGE_KEY = 'wc2026_player'
const ADMIN_KEY = 'wc2026_admin'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem(ADMIN_KEY) === 'true'
  })

  useEffect(() => {
    if (player) localStorage.setItem(STORAGE_KEY, JSON.stringify(player))
    else localStorage.removeItem(STORAGE_KEY)
  }, [player])

  async function login(pseudo: string, code: string): Promise<{ error?: string }> {
    if (code.trim().toUpperCase() !== FAMILY_CODE.toUpperCase()) {
      return { error: 'Code famille incorrect.' }
    }
    const trimmed = pseudo.trim()
    if (!trimmed) {
      return { error: 'Le pseudo ne peut pas être vide.' }
    }

    // Cherche un compte existant (insensible à la casse)
    const { data: existing } = await supabase
      .from('players')
      .select()
      .ilike('pseudo', trimmed)
      .maybeSingle()

    if (existing) {
      // Compte trouvé — connexion sur le compte existant (conserve la casse d'origine)
      setPlayer(existing as Player)
      return {}
    }

    // Aucun compte — création
    const { data, error } = await supabase
      .from('players')
      .insert({ pseudo: trimmed })
      .select()
      .single()

    if (error) return { error: 'Erreur de connexion. Réessaie.' }

    setPlayer(data as Player)
    return {}
  }

  function loginAdmin(adminCode: string): boolean {
    if (adminCode.trim() === ADMIN_CODE) {
      setIsAdmin(true)
      localStorage.setItem(ADMIN_KEY, 'true')
      return true
    }
    return false
  }

  function logout() {
    setPlayer(null)
    setIsAdmin(false)
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(ADMIN_KEY)
  }

  return (
    <AuthContext.Provider value={{ player, isAdmin, login, loginAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
