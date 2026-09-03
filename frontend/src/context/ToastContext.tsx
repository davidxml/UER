import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { AlertTriangleIcon, CheckCircle2Icon } from '../components/icons'

type ToastKind = 'success' | 'error'

type Toast = {
  id: number
  kind: ToastKind
  message: string
}

type ToastContextValue = {
  showToast: (kind: ToastKind, message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TOAST_DURATION_MS = 3200

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++toastId
      setToasts((current) => [...current, { id, kind, message }])
      window.setTimeout(() => removeToast(id), TOAST_DURATION_MS)
    },
    [removeToast],
  )

  const value = useMemo<ToastContextValue>(
    () => ({ showToast }),
    [showToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast stack */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed left-1/2 top-4 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4"
      >
        {toasts.map((toast) => {
          const Icon =
            toast.kind === 'success' ? CheckCircle2Icon : AlertTriangleIcon
          const tone =
            toast.kind === 'success'
              ? 'border-status-success/30 text-status-success'
              : 'border-status-danger/30 text-status-danger'
          return (
            <div
              key={toast.id}
              className={`flex items-center gap-2 rounded-xl border bg-surface-white px-4 py-3 text-sm font-semibold text-ink-main shadow-lg ${tone}`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{toast.message}</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const value = useContext(ToastContext)
  if (!value) {
    throw new Error('useToast must be used inside a ToastProvider')
  }
  return value
}
