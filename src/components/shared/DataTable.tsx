import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Checkbox } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/misc';
import { usePagination } from '@/hooks/usePagination';
import { cn } from '@/utils/cn';
import { formatInt } from '@/utils/format';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
  headerClassName?: string;
  align?: 'left' | 'right' | 'center';
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  isRowSelectable?: (row: T) => boolean;
  pageSize?: number;
  empty?: { title: string; description?: string; action?: ReactNode; icon?: ReactNode };
  defaultSort?: { key: string; dir: 'asc' | 'desc' };
  rowClassName?: (row: T) => string | undefined;
  dense?: boolean;
}

const hideClass = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell', xl: 'hidden xl:table-cell' };

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  onRowClick,
  selectable,
  selected = [],
  onSelectedChange,
  isRowSelectable,
  pageSize = 20,
  empty,
  defaultSort,
  rowClassName,
  dense,
}: DataTableProps<T>) {
  const [sort, setSort] = useState(defaultSort);

  const sorted = useMemo(() => {
    const list = rows ?? [];
    if (!sort) return list;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return list;
    const factor = sort.dir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const va = col.sortValue!(a);
      const vb = col.sortValue!(b);
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * factor;
      return String(va).localeCompare(String(vb), 'pt-BR', { numeric: true }) * factor;
    });
  }, [rows, sort, columns]);

  const { page, setPage, pageCount, pageItems, total } = usePagination(sorted, pageSize);
  const selectableIds = pageItems.filter((r) => !isRowSelectable || isRowSelectable(r)).map(rowKey);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.includes(id));
  const someSelected = selectableIds.some((id) => selected.includes(id));

  const toggleAll = (checked: boolean) => {
    if (!onSelectedChange) return;
    onSelectedChange(checked ? Array.from(new Set([...selected, ...selectableIds])) : selected.filter((id) => !selectableIds.includes(id)));
  };
  const toggle = (id: string, checked: boolean) => {
    onSelectedChange?.(checked ? [...selected, id] : selected.filter((s) => s !== id));
  };

  const cellPad = dense ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70">
              {selectable && (
                <th className="w-10 px-4 py-2.5">
                  <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} ariaLabel="Selecionar todos" />
                </th>
              )}
              {columns.map((col) => {
                const active = sort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={cn(
                      'whitespace-nowrap px-4 py-2.5 text-left text-xs font-medium text-slate-500',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      col.hideBelow && hideClass[col.hideBelow],
                      col.headerClassName,
                    )}
                  >
                    {col.sortValue ? (
                      <button
                        type="button"
                        onClick={() => setSort({ key: col.key, dir: active && sort?.dir === 'asc' ? 'desc' : 'asc' })}
                        className={cn('inline-flex items-center gap-1 transition-colors hover:text-slate-900', active && 'text-slate-900')}
                      >
                        {col.header}
                        {active ? (
                          sort?.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100">
                  {selectable && <td className="px-4 py-3" />}
                  {columns.map((col) => (
                    <td key={col.key} className={cn(cellPad, col.hideBelow && hideClass[col.hideBelow])}>
                      <Skeleton className="h-4 w-full max-w-[140px]" />
                    </td>
                  ))}
                </tr>
              ))}
            {!loading &&
              pageItems.map((row) => {
                const id = rowKey(row);
                const isSel = selected.includes(id);
                const canSelect = !isRowSelectable || isRowSelectable(row);
                return (
                  <tr
                    key={id}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      'border-b border-slate-100 transition-colors duration-150 last:border-0',
                      onRowClick && 'cursor-pointer hover:bg-slate-50',
                      isSel && 'bg-brand-50/50 hover:bg-brand-50/70',
                      rowClassName?.(row),
                    )}
                  >
                    {selectable && (
                      <td className="w-10 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={isSel} disabled={!canSelect} onChange={(c) => toggle(id, c)} ariaLabel="Selecionar linha" />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          cellPad,
                          'align-middle text-slate-700',
                          col.align === 'right' && 'text-right tabular-nums',
                          col.align === 'center' && 'text-center',
                          col.hideBelow && hideClass[col.hideBelow],
                          col.className,
                        )}
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      {!loading && total === 0 && (
        <EmptyState
          icon={empty?.icon}
          title={empty?.title ?? 'Nenhum registro encontrado'}
          description={empty?.description ?? 'Ajuste os filtros para ver outros resultados.'}
          action={empty?.action}
        />
      )}
      {!loading && total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-[13px] text-slate-500">
          <span>
            {selected.length > 0 && <span className="mr-3 font-medium text-slate-700">{selected.length} selecionado(s)</span>}
            Exibindo {formatInt((page - 1) * pageSize + 1)}–{formatInt(Math.min(page * pageSize, total))} de {formatInt(total)}
          </span>
          {pageCount > 1 && (
            <div className="flex items-center gap-1">
              <button
                className="rounded-md p-1.5 transition-colors hover:bg-slate-100 disabled:opacity-40"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 tabular-nums">
                {page} / {pageCount}
              </span>
              <button
                className="rounded-md p-1.5 transition-colors hover:bg-slate-100 disabled:opacity-40"
                disabled={page === pageCount}
                onClick={() => setPage(page + 1)}
                aria-label="Próxima página"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
