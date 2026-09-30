import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import type { Tasting } from '../types';
import { useApp } from '../store';
import { DIAS_CURTO, MESES, fmtLong, monthCells, monthKey } from '../lib/dates';
import { STATUS_STYLE } from '../lib/status';
import { Button, Card, EmptyState, StatusBadge, cn } from './ui';

export function MonthHeader({ year, month, onChange }: { year: number; month: number; onChange: (y: number, m: number) => void }) {
  const go = (n: number) => {
    const d = new Date(year, month + n, 1);
    onChange(d.getFullYear(), d.getMonth());
  };
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-base font-bold uppercase tracking-wide text-navy-900">{MESES[month]} {year}</h3>
      <div className="flex gap-1">
        <Button size="sm" variant="secondary" onClick={() => go(-1)} aria-label="Mês anterior"><ChevronLeft size={16} /></Button>
        <Button size="sm" variant="secondary" onClick={() => go(1)} aria-label="Próximo mês"><ChevronRight size={16} /></Button>
      </div>
    </div>
  );
}

export function WeekdayRow() {
  return (
    <div className="mt-4 grid grid-cols-7 gap-1 sm:gap-1.5">
      {DIAS_CURTO.map((d) => <div key={d} className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">{d}</div>)}
    </div>
  );
}

/** Calendário mensal com quantidade de degustações por dia + painel do dia selecionado. */
export function AgendaCalendar({ rows, compact = false }: { rows: Tasting[]; compact?: boolean }) {
  const { today, client, brandName, openDetail, promoterName, role } = useApp();
  const [ym, setYm] = useState(() => ({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 }));
  const [sel, setSel] = useState<string>(today);
  const cells = monthCells(ym.y, ym.m);
  const byDay = useMemo(() => {
    const m = new Map<string, Tasting[]>();
    rows.filter((t) => t.status !== 'CANCELADA').forEach((t) => m.set(t.date, [...(m.get(t.date) ?? []), t]));
    return m;
  }, [rows]);
  const dayRows = (byDay.get(sel) ?? []).sort((a, b) => a.start.localeCompare(b.start));
  const monthTotal = [...byDay.entries()].filter(([k]) => monthKey(k) === `${ym.y}-${String(ym.m + 1).padStart(2, '0')}`).reduce((n, [, v]) => n + v.length, 0);

  return (
    <div className={cn('grid gap-5', compact ? 'xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]' : 'lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]')}>
      <Card className="p-4 sm:p-5">
        <MonthHeader year={ym.y} month={ym.m} onChange={(y, m) => setYm({ y, m })} />
        <p className="mt-1 text-xs text-slate-500">{monthTotal} {monthTotal === 1 ? 'degustação' : 'degustações'} no mês</p>
        <WeekdayRow />
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {cells.map((iso, i) => {
            if (!iso) return <div key={i} />;
            const list = byDay.get(iso) ?? [];
            const isSel = sel === iso;
            const isToday = iso === today;
            return (
              <button
                key={iso}
                onClick={() => setSel(iso)}
                className={cn(
                  'flex aspect-square flex-col items-stretch justify-between rounded-lg border p-1 text-left transition sm:aspect-auto sm:min-h-[76px] sm:p-2',
                  isSel ? 'border-navy-900 bg-navy-900 text-white' : isToday ? 'border-accent-400 bg-accent-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                )}
              >
                <span className={cn('text-xs font-bold sm:text-sm', isToday && !isSel && 'text-accent-600')}>{Number(iso.slice(8))}</span>
                {list.length > 0 && (
                  <span>
                    <span className="mb-1 hidden gap-0.5 sm:flex">
                      {list.slice(0, 5).map((t) => <span key={t.id} className={cn('h-1.5 w-1.5 rounded-full', STATUS_STYLE[t.status].dot)} />)}
                    </span>
                    <span className={cn('block text-[10px] font-semibold leading-tight sm:text-[11px]', isSel ? 'text-navy-100' : 'text-slate-500')}>
                      {list.length}<span className="hidden sm:inline"> {list.length === 1 ? 'degustação' : 'degustações'}</span>
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Dia selecionado</p>
          <h3 className="mt-0.5 text-sm font-semibold">{fmtLong(sel)}</h3>
          <p className="text-xs text-slate-500">{dayRows.length} {dayRows.length === 1 ? 'degustação' : 'degustações'}</p>
        </div>
        {dayRows.length === 0 ? (
          <EmptyState title="Sem degustações neste dia" text="Selecione outro dia no calendário." />
        ) : (
          <ul className="scroll-thin max-h-[440px] divide-y divide-slate-100 overflow-y-auto">
            {dayRows.map((t) => (
              <li key={t.id}>
                <button onClick={() => openDetail(t.id)} className="flex w-full gap-3 px-5 py-3.5 text-left hover:bg-slate-50">
                  <span className="mt-0.5 flex items-center gap-1 text-xs font-semibold tabular text-slate-500"><Clock size={12} />{t.start}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{client(t.codcli)?.fantasia}</span>
                    <span className="block text-xs text-slate-500">{brandName(t)}{role !== 'promotor' ? ` · ${promoterName(t.promotorId)}` : ''}</span>
                    <span className="mt-1.5 inline-block"><StatusBadge status={t.status} /></span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
