'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';

type ToastType = 'success' | 'error' | 'warning';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => undefined });

let _id = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++_id;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const borderColor: Record<ToastType, string> = {
    success: '#25d366',
    error: '#ef4444',
    warning: '#f59e0b',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minWidth: 280,
          maxWidth: 400,
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background: '#1c1c1c',
              border: '1px solid #2a2a2a',
              borderLeft: `3px solid ${borderColor[t.type]}`,
              borderRadius: 8,
              padding: '12px 16px',
              color: '#ffffff',
              fontSize: 13,
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              animation: 'slideIn 0.2s ease',
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
