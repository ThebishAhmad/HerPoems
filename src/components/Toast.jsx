import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])
    const idRef = useRef(0)

    const showToast = useCallback(message => {
        const id = ++idRef.current
        setToasts(prev => [...prev, { id, message }])
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 3000)
    }, [])

    return (
        <ToastContext.Provider value={showToast}>
            {children}
            <ToastContainer toasts={toasts} />
        </ToastContext.Provider>
    )
}

export function useToast() {
    return useContext(ToastContext)
}

function ToastContainer({ toasts }) {
    return (
        <div className="toast-container">
            {toasts.map(t => (
                <div key={t.id} className="toast" style={{ animation: 'toastIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                    {t.message}
                </div>
            ))}
            <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(40px) scale(0.95); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
        </div>
    )
}
