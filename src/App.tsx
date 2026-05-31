import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import MatchsPage from './pages/MatchsPage'
import ClassementPage from './pages/ClassementPage'
import ProfilPage from './pages/ProfilPage'
import AdminPage from './pages/AdminPage'
import React from 'react'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { player } = useAuth()
  if (!player) return <Navigate to="/" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { player } = useAuth()

  return (
    <Routes>
      <Route path="/" element={player ? <Navigate to="/matchs" replace /> : <LoginPage />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/matchs" element={<MatchsPage />} />
        <Route path="/classement" element={<ClassementPage />} />
        <Route path="/profil" element={<ProfilPage />} />
        <Route path="/admin" element={<AdminPage />} />
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
              background: '#111e35',
              color: '#e2e8f0',
              border: '1px solid #1e3a5f',
              borderRadius: '12px',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
