import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './context/AuthContext'
import Splash from './pages/Splash'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Submissions from './pages/Submissions'
import Tracking from './pages/Tracking'

/** Gates the reporter screens behind an authenticated session (incl. guest). */
function RequireAuth({ children }: { children: ReactNode }) {
  const { isHydrated, isAuthenticated } = useAuth()
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
 * The reporter application. This bundle deliberately contains NO responder
 * routes — the responder console is built and deployed as a separate entry
 * point, so a reporter can never reach the responder UI through this app.
 */
export default function ReporterApp() {
  return (
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
      {/* No /responder/* routes here — that's a separate deployment. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
