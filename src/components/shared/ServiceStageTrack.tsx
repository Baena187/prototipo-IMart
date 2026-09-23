import { Check } from 'lucide-react';
import type { ServiceStage } from '@/types';
import { cn } from '@/utils/cn';
import { SERVICE_STAGES } from '@/utils/labels';

/** Linha do tempo do ciclo de serviço iMart (Projeto → Evolução). */
export function ServiceStageTrack({ current, compact }: { current?: ServiceStage; compact?: boolean }) {
  const idx = current ? SERVICE_STAGES.findIndex((s) => s.value === current) : -1;
  return (
    <ol className={cn('grid gap-2', compact ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5')}>
      {SERVICE_STAGES.map((s, i) => {
        const done = idx >= 0 && i < idx;
        const active = i === idx;
        return (
          <li
            key={s.value}
            className={cn(
              'relative rounded-md border px-3 py-2.5',
              active ? 'border-brand-300 bg-brand-50/60' : done ? 'border-slate-200 bg-white' : 'border-dashed border-slate-200 bg-slate-50/50',
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
                  active ? 'bg-brand-700 text-white' : done ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500',
                )}
              >
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className={cn('text-[13px] font-medium', active ? 'text-brand-800' : done ? 'text-slate-800' : 'text-slate-500')}>{s.label}</span>
            </div>
            {!compact && <p className="mt-1.5 text-xs text-slate-500">{s.description}</p>}
          </li>
        );
      })}
    </ol>
  );
}
