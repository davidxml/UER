import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import ResponderDashboard from './responder/ResponderDashboard'
import ResponderLogin from './responder/ResponderLogin'
import {
  readResponderSession,
  saveResponderSession,
} from './responder/responderAuth'
import type { ResponderSession } from './responder/responderAuth'

/** Gates the responder dashboard behind a valid session (department + JWT). */
function RequireResponderAuth({ children }: { children: ReactNode }) {
  const session = readResponderSession()
  // A session with a token means the responder authenticated against the
  // backend. Without the token there is no valid identity, so send to login.
  if (!session) return <Navigate to="/login" replace />
  return children
}

/**
 * The responder console application. This bundle deliberately contains NO
 * reporter routes — it is deployed separately (e.g. on the respond subdomain)
 * so reporters cannot reach it. Login verifies the PIN against the backend and
 * stores the returned JWT; the dashboard's status/severity mutations then hit
 * the backend with that token.
 */
export default function ResponderApp() {
  const navigate = useNavigate()

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={
          <ResponderLogin
            onLogin={(session: ResponderSession) => {
              saveResponderSession(session)
              navigate('/dashboard', { replace: true })
            }}
          />
        }
      />
      <Route
        path="/dashboard"
        element={
          <RequireResponderAuth>
            <ResponderDashboard />
          </RequireResponderAuth>
        }
      />
      {/* No reporter routes here — that's a separate deployment. */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
