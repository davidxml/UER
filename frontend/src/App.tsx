import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { IncidentProvider } from './context/IncidentContext'
import { ToastProvider } from './context/ToastContext'
import Splash from './pages/Splash'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Submissions from './pages/Submissions'
import Tracking from './pages/Tracking'
import ResponderDashboard from './responder/ResponderDashboard'
import './App.css'

/** Gates the reporter screens behind an authenticated session (incl. guest). */
function RequireAuth({ children }: { children: ReactNode }) {
  const { isHydrated, isAuthenticated } = useAuth()

  // Never decide before the stored session has been read.
  if (!isHydrated) return null
  if (!isAuthenticated) return <Navigate to="/auth" replace />

  return children
}

/** Keeps an already-authenticated user off the login form. */
function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { isHydrated, isAuthenticated } = useAuth()

  if (!isHydrated) return null
  if (isAuthenticated) return <Navigate to="/home" replace />

  return children
}

function App() {
  return (
    <AuthProvider>
      <IncidentProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Splash />} />
              <Route
                path="/auth"
                element={
                  <RedirectIfAuthenticated>
                    <Auth />
                  </RedirectIfAuthenticated>
                }
              />
              <Route
                path="/home"
                element={
                  <RequireAuth>
                    <Home />
                  </RequireAuth>
                }
              />
              <Route
                path="/submissions"
                element={
                  <RequireAuth>
                    <Submissions />
                  </RequireAuth>
                }
              />
              <Route
                path="/tracking"
                element={
                  <RequireAuth>
                    <Tracking />
                  </RequireAuth>
                }
              />
              {/* Responder/Admin dashboard */}
              <Route path="/responder" element={<ResponderDashboard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </IncidentProvider>
    </AuthProvider>
  )
}

export default App
