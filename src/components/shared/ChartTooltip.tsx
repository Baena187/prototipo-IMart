import { formatNumber } from '@/utils/format';

interface Payload {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

/** Tooltip padrão dos gráficos (Recharts). */
export function ChartTooltip({
  active,
  payload,
  label,
  suffix = '',
  digits = 0,
  names,
}: {
  active?: boolean;
  payload?: Payload[];
  label?: string | number;
  suffix?: string;
  digits?: number;
  names?: Record<string, string>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-pop">
      {label !== undefined && <p className="mb-1 font-medium text-slate-900">{label}</p>}
      {payload.map((p) => (
        <p key={String(p.dataKey ?? p.name)} className="flex items-center gap-2 text-slate-600">
          <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: p.color }} />
          {names?.[String(p.dataKey)] ?? p.name}:
          <span className="font-medium tabular-nums text-slate-900">
            {typeof p.value === 'number' ? formatNumber(p.value, digits) : p.value}
            {suffix}
          </span>
        </p>
      ))}
    </div>
  );
}
