import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import ClassementPage from './pages/ClassementPage'
import ProfilPage from './pages/ProfilPage'
import AdminPage from './pages/AdminPage'
import BracketPage from './pages/BracketPage'
import AidePage from './pages/AidePage'
import React from 'react'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { player } = useAuth()
  if (!player) return <Navigate to="/" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loginAdmin } = useAuth()
  const [code, setCode] = React.useState('')
  const [error, setError] = React.useState('')

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#03061a] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white shadow-2xl">
          <div className="bg-[#003087] px-6 py-4">
            <p className="font-condensed text-[18px] font-700 uppercase tracking-widest text-white">
              Accès administrateur
            </p>
          </div>
          <form className="px-6 py-6 space-y-4" onSubmit={e => {
            e.preventDefault()
            if (loginAdmin(code.trim())) setError('')
            else setError('Code administrateur incorrect.')
          }}>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                Code admin
              </label>
              <input
                type="password"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 px-3 py-2 text-[14px] text-gray-900 focus:outline-none focus:border-[#003087]"
              />
            </div>
            {error && <p className="text-[12px] text-[#c8102e] font-medium">{error}</p>}
            <button
              type="submit"
              className="w-full bg-[#003087] hover:bg-[#001e5c] text-white font-semibold uppercase tracking-widest text-[13px] py-3 transition-colors"
            >
              Accéder
            </button>
          </form>
        </div>
      </div>
    )
  }
  return <>{children}</>
}

function AppRoutes() {
  const { player } = useAuth()

  return (
    <Routes>
      <Route path="/" element={player ? <Navigate to="/bracket" replace /> : <LoginPage />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/bracket" element={<BracketPage />} />
        <Route path="/classement" element={<ClassementPage />} />
        <Route path="/profil" element={<ProfilPage />} />
        <Route path="/aide" element={<AidePage />} />
      </Route>
      <Route path="/admin" element={<AdminRoute><AppLayout /></AdminRoute>}>
        <Route index element={<AdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/Worldcup2026">
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#303134',
              color: '#e8eaed',
              border: '1px solid #5f6368',
              borderRadius: '2px',
              fontSize: '13px',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
