import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { initials } from '@/utils/format';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-slate-100', className)} {...props} />;
}

export function Separator({ className, vertical }: { className?: string; vertical?: boolean }) {
  return <div className={cn(vertical ? 'mx-1 h-5 w-px bg-slate-200' : 'my-1 h-px w-full bg-slate-100', className)} />;
}

const avatarColors = ['bg-slate-700', 'bg-brand-700', 'bg-emerald-700', 'bg-amber-700', 'bg-rose-700', 'bg-cyan-700', 'bg-violet-700'];

export function Avatar({ name, size = 'md', className }: { name: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const color = avatarColors[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white',
        size === 'sm' && 'h-6 w-6 text-[10px]',
        size === 'md' && 'h-8 w-8 text-xs',
        size === 'lg' && 'h-11 w-11 text-sm',
        color,
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function Progress({ value, tone = 'blue', className }: { value: number; tone?: 'blue' | 'green' | 'amber' | 'red'; className?: string }) {
  const colors = { blue: 'bg-brand-600', green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500' };
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-slate-100', className)}>
      <div className={cn('h-full rounded-full transition-all duration-300', colors[tone])} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans text-[11px] font-medium text-slate-500">{children}</kbd>;
}

export function Tooltip({ content, children, side = 'top' }: { content: ReactNode; children: ReactNode; side?: 'top' | 'bottom' }) {
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow transition-opacity duration-150 group-hover/tt:opacity-100',
          side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
        )}
      >
        {content}
      </span>
    </span>
  );
}

export function Tabs<T extends string>({
  value,
  onChange,
  items,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  items: { value: T; label: ReactNode; count?: number }[];
  className?: string;
}) {
  return (
    <div className={cn('flex gap-1 overflow-x-auto border-b border-slate-200', className)} role="tablist">
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              '-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors duration-150',
              active ? 'border-brand-700 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800',
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className={cn('rounded-full px-1.5 text-[11px] font-semibold', active ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500')}>
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  items,
  size = 'md',
}: {
  value: T;
  onChange: (v: T) => void;
  items: { value: T; label: ReactNode; title?: string }[];
  size?: 'sm' | 'md';
}) {
  return (
    <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          title={item.title}
          onClick={() => onChange(item.value)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-[5px] font-medium transition-colors duration-150 [&_svg]:h-4 [&_svg]:w-4',
            size === 'sm' ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-[13px]',
            item.value === value ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
