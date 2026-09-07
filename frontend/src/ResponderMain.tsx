import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { IncidentProvider } from './context/IncidentContext'
import { ToastProvider } from './context/ToastContext'
import ResponderApp from './ResponderApp'
import './index.css'

// Responder bundle — mounts only the responder console routes. Deployed as a
// separate entry point so reporters never receive (or can reach) this UI.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IncidentProvider>
      <ToastProvider>
        <BrowserRouter>
          <ResponderApp />
        </BrowserRouter>
      </ToastProvider>
    </IncidentProvider>
  </StrictMode>,
)
