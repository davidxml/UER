import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
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
import ResponderLogin from './responder/ResponderLogin'
import {
  readResponderSession,
  saveResponderSession,
} from './responder/responderAuth'
import type { ResponderSession } from './responder/responderAuth'
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

/**
 * Gates the responder dashboard behind an active responder session (a unit +
 * JWT stored under 'uer_responder_auth'). Mirrors RequireAuth, but reads the
 * localStorage session directly — synchronous, so no hydration flag is needed.
 */
function RequireResponderAuth({ children }: { children: ReactNode }) {
  const session = readResponderSession()
  if (!session) return <Navigate to="/responder/login" replace />
  return children
}

/** Responder login route: persists the JWT session, then goes to the dashboard. */
function ResponderLoginRoute() {
  const navigate = useNavigate()

  return (
    <ResponderLogin
      onLogin={(session: ResponderSession) => {
        saveResponderSession(session)
        // Replace so Back cannot return to a spent login form.
        navigate('/responder/dashboard', { replace: true })
      }}
    />
  )
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
              {/* Responder/Admin console */}
              <Route path="/responder/login" element={<ResponderLoginRoute />} />
              <Route
                path="/responder/dashboard"
                element={
                  <RequireResponderAuth>
                    <ResponderDashboard />
                  </RequireResponderAuth>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </IncidentProvider>
    </AuthProvider>
  )
}

export default App
