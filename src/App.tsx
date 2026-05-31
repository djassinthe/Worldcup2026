import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import ClassementPage from './pages/ClassementPage'
import ProfilPage from './pages/ProfilPage'
import AdminPage from './pages/AdminPage'
import BracketPage from './pages/BracketPage'
import React from 'react'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { player } = useAuth()
  if (!player) return <Navigate to="/" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/" replace />
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
