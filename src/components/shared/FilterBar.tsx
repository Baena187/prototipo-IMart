import { Search, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Input, Select } from '@/components/ui/form';
import { cn } from '@/utils/cn';

export function FilterBar({
  search,
  onSearch,
  placeholder = 'Buscar…',
  children,
  onClear,
  hasFilters,
  actions,
  className,
}: {
  search?: string;
  onSearch?: (v: string) => void;
  placeholder?: string;
  children?: ReactNode;
  onClear?: () => void;
  hasFilters?: boolean;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2 border-b border-slate-100 p-3 lg:flex-row lg:items-center', className)}>
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {onSearch && (
          <div className="w-full sm:w-72">
            <Input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} icon={<Search />} aria-label="Buscar" />
          </div>
        )}
        {children}
        {hasFilters && onClear && (
          <button onClick={onClear} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800">
            <X className="h-3.5 w-3.5" /> Limpar filtros
          </button>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function FilterSelect<T extends string>({
  value,
  onChange,
  options,
  allLabel,
  className,
  ariaLabel,
}: {
  value: T | '';
  onChange: (v: T | '') => void;
  options: { value: T; label: string }[];
  allLabel: string;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div className={cn('w-full sm:w-auto sm:min-w-[160px]', className)}>
      <Select value={value} onChange={(e) => onChange(e.target.value as T | '')} aria-label={ariaLabel ?? allLabel} className={cn(value && 'border-brand-200 bg-brand-50/40')}>
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

/** Chips de filtro rápido. */
export function QuickFilters<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (v: T) => void;
  items: { value: T; label: string; count?: number }[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-medium transition-colors duration-150',
            value === item.value ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
          )}
        >
          {item.label}
          {item.count !== undefined && <span className={cn('tabular-nums', value === item.value ? 'text-slate-300' : 'text-slate-400')}>{item.count}</span>}
        </button>
      ))}
    </div>
  );
}
