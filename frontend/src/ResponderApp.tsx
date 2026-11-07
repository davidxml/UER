import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './context/AuthContext'
import { IncidentProvider } from './context/IncidentContext'
import ResponderDashboard from './responder/ResponderDashboard'
import ResponderLogin from './responder/ResponderLogin'

/** Gates the responder dashboard behind a valid RESPONDER session. */
function RequireResponderAuth({ children }: { children: ReactNode }) {
  const { isHydrated, isAuthenticated, user } = useAuth()
  if (!isHydrated) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'RESPONDER') return <Navigate to="/login" replace />
  return children
}

function ResponderShell() {
  return (
    <RequireResponderAuth>
      <IncidentProvider scope="responder">
        <Outlet />
      </IncidentProvider>
    </RequireResponderAuth>
  )
}

/**
 * The responder console application. This bundle deliberately contains NO
 * reporter routes — it is deployed separately so reporters cannot reach it.
 * Login uses the shared auth service; the unit is fixed on the account.
 */
export default function ResponderApp() {
  const { isHydrated, isAuthenticated, user } = useAuth()

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/login"
        element={
          isHydrated && isAuthenticated && user?.role === 'RESPONDER' ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <ResponderLogin />
          )
        }
      />
      <Route element={<ResponderShell />}>
        <Route path="/dashboard" element={<ResponderDashboard />} />
      </Route>
      {/* No reporter routes here — that's a separate deployment. */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
