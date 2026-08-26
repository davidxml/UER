import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Splash from './pages/Splash'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Reported from './pages/Reported'
import './App.css'

/** Gates /home and /reported behind an authenticated prototype session. */
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
            path="/reported"
            element={
              <RequireAuth>
                <Reported />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
