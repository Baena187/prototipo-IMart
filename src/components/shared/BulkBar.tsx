import { X } from 'lucide-react';
import type { ReactNode } from 'react';

/** Barra de ações em massa exibida quando há linhas selecionadas. */
export function BulkBar({ count, onClear, children }: { count: number; onClear: () => void; children: ReactNode }) {
  if (count === 0) return null;
  return (
    <div className="flex animate-fade-in flex-wrap items-center gap-2 border-b border-brand-100 bg-brand-50/60 px-4 py-2">
      <span className="text-[13px] font-medium text-brand-800">{count} selecionado(s)</span>
      <button onClick={onClear} className="rounded p-0.5 text-brand-700 hover:bg-brand-100" aria-label="Limpar seleção">
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="ml-auto flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
