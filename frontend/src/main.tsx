import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import { AuthProvider } from './context/AuthContext'
import { IncidentProvider } from './context/IncidentContext'
import { ToastProvider } from './context/ToastContext'
import ReporterApp from './ReporterApp'
import './index.css'

registerSW({ immediate: true })

// Reporter bundle — mounts only the reporter routes. The responder console is
// a separate entry point (ResponderMain.tsx) built and deployed independently.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <IncidentProvider>
        <ToastProvider>
          <BrowserRouter>
            <ReporterApp />
          </BrowserRouter>
        </ToastProvider>
      </IncidentProvider>
    </AuthProvider>
  </StrictMode>,
)