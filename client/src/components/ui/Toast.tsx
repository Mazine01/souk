import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: number;
  message: string;
  tone: 'default' | 'error';
  action?: ToastAction;
  duration: number;
}

type Push = (message: string, opts?: { tone?: Toast['tone']; action?: ToastAction; duration?: number }) => void;

const ToastContext = createContext<Push | null>(null);

export function useToast() {
  const push = useContext(ToastContext);
  if (!push) throw new Error('useToast must be used inside <ToastProvider>');
  return push;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback<Push>((message, opts = {}) => {
    const id = nextId.current++;
    setToasts((t) => [
      ...t.slice(-2),
      { id, message, tone: opts.tone ?? 'default', action: opts.action, duration: opts.duration ?? 4000 },
    ]);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4 sm:bottom-6"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  // Keep the latest callback in a ref so re-renders don't restart the countdown.
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  useEffect(() => {
    const timer = setTimeout(() => dismissRef.current(), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.duration]);

  return (
    <div
      role={toast.tone === 'error' ? 'alert' : 'status'}
      className={`animate-pop-in pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-panel px-4 py-3 text-sm shadow-panel ${
        toast.tone === 'error' ? 'bg-danger text-white dark:text-paper' : 'bg-[rgb(28_27_41)] text-white'
      }`}
    >
      <span className="flex-1">{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action!.onClick();
            onDismiss();
          }}
          className="rounded-control px-2 py-1 font-semibold text-[rgb(240_186_82)] hover:bg-white/10"
        >
          {toast.action.label}
        </button>
      )}
      <button type="button" aria-label="Dismiss" onClick={onDismiss} className="rounded-control p-1 opacity-70 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  );
}
