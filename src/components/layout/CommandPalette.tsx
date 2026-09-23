import { CornerDownLeft, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Kbd } from '@/components/ui/misc';
import { useDebounce } from '@/hooks/useDebounce';
import { globalSearch, type SearchResult } from '@/services';
import { cn } from '@/utils/cn';

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const debounced = useDebounce(query, 120);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => (open ? globalSearch(debounced) : []), [debounced, open]);
  const groups = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    results.forEach((r) => map.set(r.group, [...(map.get(r.group) ?? []), r]));
    return Array.from(map.entries());
  }, [results]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);
  useEffect(() => setActive(0), [debounced]);

  if (!open) return null;

  const go = (r: SearchResult) => {
    onClose();
    navigate(r.to);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter' && results[active]) {
      go(results[active]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  let index = -1;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
      <div className="fixed inset-0 animate-fade-in bg-slate-900/30" onClick={onClose} />
      <div className="relative w-full max-w-xl animate-scale-in overflow-hidden rounded-xl border border-slate-200 bg-white shadow-pop">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Buscar lojas, gôndolas, réguas, produtos, campanhas…"
            className="h-12 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
          <Kbd>Esc</Kbd>
        </div>
        <div className="max-h-[420px] overflow-y-auto p-2">
          {results.length === 0 && <p className="px-3 py-8 text-center text-sm text-slate-500">Nenhum resultado para “{query}”.</p>}
          {groups.map(([group, items]) => (
            <div key={group} className="mb-1">
              <p className="px-2.5 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">{group}</p>
              {items.map((r) => {
                index++;
                const i = index;
                return (
                  <button
                    key={r.group + r.id}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(r)}
                    className={cn('flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left', active === i ? 'bg-slate-100' : 'hover:bg-slate-50')}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-slate-900">{r.title}</span>
                      {r.subtitle && <span className="block truncate text-xs text-slate-500">{r.subtitle}</span>}
                    </span>
                    {active === i && <CornerDownLeft className="h-3.5 w-3.5 text-slate-400" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
