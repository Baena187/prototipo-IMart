import type { ReactNode } from 'react';
import { formatDateTime } from '@/utils/format';

export function Timeline({ items }: { items: { id: string; at: string; title: ReactNode; description?: ReactNode; meta?: ReactNode }[] }) {
  return (
    <ol className="relative space-y-4 border-l border-slate-200 pl-5">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-slate-400 ring-1 ring-slate-200" />
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <p className="text-sm font-medium text-slate-900">{item.title}</p>
            <time className="text-xs tabular-nums text-slate-500">{formatDateTime(item.at)}</time>
          </div>
          {item.description && <p className="mt-0.5 text-sm text-slate-600">{item.description}</p>}
          {item.meta && <div className="mt-1">{item.meta}</div>}
        </li>
      ))}
    </ol>
  );
}
