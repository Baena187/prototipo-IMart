import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Inbox, X } from 'lucide-react';
import type { Status } from '../types';
import { STATUS_LABEL, STATUS_STYLE } from '../lib/status';

export const cn = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ');

type Variant = 'primary' | 'secondary' | 'dark' | 'ghost' | 'danger' | 'success';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent-500 text-white hover:bg-accent-600 shadow-card focus-visible:ring-accent-500',
  dark: 'bg-navy-900 text-white hover:bg-navy-800 shadow-card focus-visible:ring-navy-900',
  secondary: 'bg-white text-navy-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus-visible:ring-navy-500',
  ghost: 'text-navy-700 hover:bg-slate-100 focus-visible:ring-navy-500',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-600',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600',
};
const SIZES = { sm: 'h-8 px-3 text-xs gap-1.5', md: 'h-10 px-4 text-sm gap-2', lg: 'h-12 px-6 text-sm gap-2 tracking-wide' };

export function Button({
  variant = 'secondary', size = 'md', className, ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: keyof typeof SIZES }) {
  return (
    <button
      type="button"
      {...p}
      className={cn(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50',
        VARIANTS[variant], SIZES[size], className,
      )}
    />
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('min-w-0 rounded-xl border border-slate-200 bg-white shadow-card', className)}>{children}</div>;
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div>
        <h3 className="text-sm font-semibold text-navy-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset', className)}>{children}</span>;
}

export function StatusBadge({ status }: { status: Status }) {
  const s = STATUS_STYLE[status];
  return (
    <Badge className={s.badge}>
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
      {STATUS_LABEL[status].toUpperCase()}
    </Badge>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-navy-900 sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label, value, hint, icon, tone = 'navy', onClick,
}: { label: string; value: ReactNode; hint?: string; icon: ReactNode; tone?: 'navy' | 'accent' | 'amber' | 'emerald' | 'sky'; onClick?: () => void }) {
  const tones = { navy: 'bg-navy-50 text-navy-700', accent: 'bg-accent-50 text-accent-600', amber: 'bg-amber-50 text-amber-600', emerald: 'bg-emerald-50 text-emerald-600', sky: 'bg-sky-50 text-sky-600' };
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={cn('min-w-0 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-card', onClick && 'transition hover:border-slate-300 hover:shadow-pop')}
    >
      <div className="flex items-center justify-between">
        <span className="pr-2 text-xs font-medium leading-tight text-slate-500">{label}</span>
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', tones[tone])}>{icon}</span>
      </div>
      <div className="tabular mt-2 text-3xl font-bold tracking-tight text-navy-900">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-slate-500">{hint}</div>}
    </Tag>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Inbox size={20} /></span>
      <p className="text-sm font-semibold text-navy-900">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Modal({
  open, onClose, title, subtitle, children, footer, size = 'md',
}: { open: boolean; onClose: () => void; title?: ReactNode; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', k);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  const w = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }[size];
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade-in bg-navy-950/50 backdrop-blur-[1px]" onClick={onClose} />
      <div className={cn('relative flex max-h-[92vh] w-full animate-scale-in flex-col rounded-t-2xl bg-white shadow-pop sm:rounded-2xl', w)}>
        {title && (
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-base font-semibold text-navy-900">{title}</h2>
              {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
            </div>
            <button onClick={onClose} aria-label="Fechar" className="-mr-1.5 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>
          </div>
        )}
        <div className="scroll-thin flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 sm:rounded-b-2xl sm:px-6">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

const field = 'w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-navy-900 placeholder:text-slate-400 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 disabled:bg-slate-50 disabled:text-slate-500';
export const inputCls = cn(field, 'h-10');
export const textareaCls = cn(field, 'py-2.5');

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-xs font-semibold text-navy-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; count?: number }[] }) {
  return (
    <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn('whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition', value === o.value ? 'bg-white text-navy-900 shadow-card' : 'text-slate-500 hover:text-navy-800')}
        >
          {o.label}
          {o.count !== undefined && <span className="ml-1.5 text-slate-400">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Avatar({ name, size = 32, tone = 'navy' }: { name: string; size?: number; tone?: 'navy' | 'accent' | 'slate' }) {
  const ini = name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  const t = { navy: 'bg-navy-800 text-white', accent: 'bg-accent-100 text-accent-700', slate: 'bg-slate-200 text-slate-700' }[tone];
  return <span style={{ width: size, height: size, fontSize: size * 0.38 }} className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold', t)}>{ini}</span>;
}

export function KV({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-navy-900">{children}</dd>
    </div>
  );
}

export function ToastHost({ toasts }: { toasts: { id: number; text: string; kind: string }[] }) {
  const dot = { ok: 'bg-emerald-400', info: 'bg-sky-400', warn: 'bg-amber-400' } as Record<string, string>;
  return createPortal(
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:left-auto sm:right-4 sm:translate-x-0">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto flex animate-toast-in items-center gap-2.5 rounded-lg bg-navy-900 px-4 py-3 text-sm font-medium text-white shadow-pop">
          <span className={cn('h-2 w-2 shrink-0 rounded-full', dot[t.kind])} />
          {t.text}
        </div>
      ))}
    </div>,
    document.body,
  );
}
