'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counterRef = useRef(0)

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${++counterRef.current}`
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3500)
  }, [])

  const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  const icons = {
    success: <CheckCircle2 size={18} className="text-forest shrink-0" />,
    error: <XCircle size={18} className="text-red-500 shrink-0" />,
    info: <AlertCircle size={18} className="text-calm-400 shrink-0" />,
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 left-0 right-0 z-[9998] flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-3 max-w-sm w-full bg-white rounded-2xl px-4 py-3 shadow-xl border pointer-events-auto',
              'animate-[slideDown_0.3s_ease-out]',
              t.type === 'success' && 'border-forest/30',
              t.type === 'error' && 'border-red-200',
              t.type === 'info' && 'border-calm-200',
            )}
          >
            {icons[t.type]}
            <p className="flex-1 text-sm font-semibold text-calm-800">{t.message}</p>
            <button onClick={() => remove(t.id)} className="text-calm-300 hover:text-calm-500">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
