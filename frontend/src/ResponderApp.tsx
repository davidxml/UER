import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './context/AuthContext'
import { IncidentProvider } from './context/IncidentContext'
import AdminRespondersPage from './responder/admin/AdminRespondersPage'
import ResponderDashboard from './responder/ResponderDashboard'
import ResponderLogin from './responder/ResponderLogin'

function RequireRole({
  roles,
  children,
}: {
  roles: Array<'RESPONDER' | 'ADMIN'>
  children: ReactNode
}) {
  const { isHydrated, isAuthenticated, user } = useAuth()
  if (!isHydrated) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!user || !roles.includes(user.role as 'RESPONDER' | 'ADMIN')) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function ResponderShell() {
  return (
    <RequireRole roles={['RESPONDER']}>
      <IncidentProvider scope="responder">
        <Outlet />
      </IncidentProvider>
    </RequireRole>
  )
}

function AdminShell() {
  return (
    <RequireRole roles={['ADMIN']}>
      <Outlet />
    </RequireRole>
  )
}

/**
 * Responder/Admin console. Responders access the incident dashboard; admins
 * access provisioning tools (e.g., create responders). Deployed separately
 * from the reporter app.
 */
export default function ResponderApp() {
  const { isHydrated, isAuthenticated, user } = useAuth()

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to={user?.role === 'ADMIN' ? '/admin/responders' : '/dashboard'}
            replace
          />
        }
      />
      <Route
        path="/login"
        element={
          isHydrated && isAuthenticated && (user?.role === 'RESPONDER' || user?.role === 'ADMIN') ? (
            <Navigate to={user?.role === 'ADMIN' ? '/admin/responders' : '/dashboard'} replace />
          ) : (
            <ResponderLogin />
          )
        }
      />
      <Route element={<ResponderShell />}>
        <Route path="/dashboard" element={<ResponderDashboard />} />
      </Route>
      <Route element={<AdminShell />}>
        <Route path="/admin/responders" element={<AdminRespondersPage />} />
        <Route path="/admin" element={<Navigate to="/admin/responders" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
