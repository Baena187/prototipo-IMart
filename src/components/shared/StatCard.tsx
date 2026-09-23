import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/misc';
import { cn } from '@/utils/cn';

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: ReactNode;
  trend?: { value: string; direction: 'up' | 'down'; positive?: boolean };
  tone?: 'default' | 'danger' | 'warning' | 'success';
  to?: string;
  loading?: boolean;
}

export function StatCard({ label, value, icon, hint, trend, tone = 'default', to, loading }: StatCardProps) {
  const body = (
    <div
      className={cn(
        'h-full rounded-lg border border-slate-200 bg-white p-4 shadow-card transition-colors duration-150',
        to && 'hover:border-slate-300',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-slate-500">{label}</span>
        {icon && (
          <span
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md [&_svg]:h-4 [&_svg]:w-4',
              tone === 'default' && 'bg-slate-100 text-slate-600',
              tone === 'danger' && 'bg-red-50 text-red-600',
              tone === 'warning' && 'bg-amber-50 text-amber-600',
              tone === 'success' && 'bg-emerald-50 text-emerald-600',
            )}
          >
            {icon}
          </span>
        )}
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-7 w-20" />
      ) : (
        <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">{value}</div>
      )}
      <div className="mt-1 flex min-h-[20px] items-center gap-2 text-xs text-slate-500">
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-medium',
              (trend.positive ?? trend.direction === 'up') ? 'text-emerald-600' : 'text-red-600',
            )}
          >
            {trend.direction === 'up' ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {trend.value}
          </span>
        )}
        {hint}
      </div>
    </div>
  );
  return to ? (
    <Link to={to} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 rounded-lg">
      {body}
    </Link>
  ) : (
    body
  );
}
