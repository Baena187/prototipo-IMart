import { CircleAlert, CircleCheck, Info, LoaderCircle, X } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

type ToastTone = 'success' | 'error' | 'info' | 'loading';

interface Toast {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastApi {
  success: (title: string, description?: string) => number;
  error: (title: string, description?: string) => number;
  info: (title: string, description?: string) => number;
  loading: (title: string, description?: string) => number;
  update: (id: number, toast: Partial<Omit<Toast, 'id'>>) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);
let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const schedule = useCallback(
    (id: number, tone: ToastTone) => {
      if (tone !== 'loading') setTimeout(() => dismiss(id), tone === 'error' ? 6000 : 4200);
    },
    [dismiss],
  );

  const push = useCallback(
    (tone: ToastTone) => (title: string, description?: string) => {
      const id = ++seq;
      setToasts((t) => [...t.slice(-3), { id, title, description, tone }]);
      schedule(id, tone);
      return id;
    },
    [schedule],
  );

  const update = useCallback(
    (id: number, patch: Partial<Omit<Toast, 'id'>>) => {
      setToasts((t) => t.map((x) => (x.id === id ? { ...x, ...patch } : x)));
      if (patch.tone) schedule(id, patch.tone);
    },
    [schedule],
  );

  const api = useMemo<ToastApi>(
    () => ({ success: push('success'), error: push('error'), info: push('info'), loading: push('loading'), update, dismiss }),
    [push, update, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(380px,calc(100vw-32px))] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex animate-toast-in items-start gap-3 rounded-lg border border-slate-200 bg-white p-3.5 shadow-pop"
          >
            <span className="mt-0.5">
              {t.tone === 'success' && <CircleCheck className="h-[18px] w-[18px] text-emerald-600" />}
              {t.tone === 'error' && <CircleAlert className="h-[18px] w-[18px] text-red-600" />}
              {t.tone === 'info' && <Info className="h-[18px] w-[18px] text-brand-600" />}
              {t.tone === 'loading' && <LoaderCircle className="h-[18px] w-[18px] animate-spin text-slate-500" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn('text-sm font-medium text-slate-900')}>{t.title}</p>
              {t.description && <p className="mt-0.5 text-[13px] text-slate-500">{t.description}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="rounded p-0.5 text-slate-400 transition-colors hover:text-slate-700" aria-label="Fechar">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast fora do ToastProvider');
  return ctx;
}
