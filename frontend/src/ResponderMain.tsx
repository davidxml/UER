import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import ResponderApp from './ResponderApp'
import './index.css'

// Responder bundle — mounts only the responder console routes. Deployed as a
// separate entry point so reporters never receive (or can reach) this UI.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <ResponderApp />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  </StrictMode>,
)
