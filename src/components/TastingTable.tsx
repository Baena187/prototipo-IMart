import { UserPlus, Eye } from 'lucide-react';
import type { Tasting } from '../types';
import { useApp } from '../store';
import { fmtShort, dayNum, monthShort } from '../lib/dates';
import { isPending } from '../lib/status';
import { Button, EmptyState, StatusBadge, cn } from './ui';
import { PromoterChip, useTastingDialogs } from './TastingActions';

export function TastingTable({ rows, empty }: { rows: Tasting[]; empty?: string }) {
  const { client, sellerName, promoterName, brandName, typeName, openDetail, role } = useApp();
  const d = useTastingDialogs();
  const manager = role === 'gestora' || role === 'admin';

  if (!rows.length) return <EmptyState title="Nenhum agendamento encontrado" text={empty ?? 'Ajuste os filtros para ver outros resultados.'} />;

  const action = (t: Tasting) =>
    manager && isPending(t.status) && t.status !== 'PROMOTOR_DEFINIDO' ? (
      <Button size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); d.pick(t.id); }}><UserPlus size={14} /> DEFINIR PROMOTOR</Button>
    ) : manager && t.status === 'PROMOTOR_DEFINIDO' ? (
      <Button size="sm" variant="dark" onClick={(e) => { e.stopPropagation(); openDetail(t.id); }}>CONFIRMAR</Button>
    ) : (
      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openDetail(t.id); }}><Eye size={14} /> Detalhes</Button>
    );

  return (
    <>
      <div className="scroll-thin hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1080px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {['Data', 'Cliente', 'Cidade', 'Vendedor', 'Tipo de ação', 'Marca', 'Horário', 'Promotor', 'Status', 'Ações'].map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 font-semibold">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((t) => {
              const c = client(t.codcli);
              return (
                <tr key={t.id} onClick={() => openDetail(t.id)} className="cursor-pointer transition hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-4 py-3 font-semibold tabular">{fmtShort(t.date)}</td>
                  <td className="px-4 py-3"><div className="max-w-[210px] truncate font-medium">{c?.fantasia}</div><div className="font-mono text-[11px] text-slate-400">{t.codcli}</div></td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{c?.cidade}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{sellerName(t.vendedorId)}</td>
                  <td className="px-4 py-3 text-slate-600"><div className="max-w-[150px] truncate">{typeName(t)}</div></td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{brandName(t)}</td>
                  <td className="whitespace-nowrap px-4 py-3 tabular text-slate-600">{t.start} - {t.end}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600"><PromoterChip name={promoterName(t.promotorId)} /></td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3">{action(t)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-slate-100 md:hidden">
        {rows.map((t) => (
          <li key={t.id} onClick={() => openDetail(t.id)} className="flex gap-3 p-4">
            <div className="w-12 shrink-0 self-start rounded-lg bg-slate-100 py-1.5 text-center">
              <div className="text-lg font-bold leading-none">{dayNum(t.date)}</div>
              <div className="mt-0.5 text-[10px] font-semibold text-slate-500">{monthShort(t.date)}</div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{client(t.codcli)?.fantasia}</div>
              <div className="text-xs text-slate-500">{brandName(t)} · {t.start} - {t.end}</div>
              <div className="mt-1 text-xs text-slate-500"><PromoterChip name={promoterName(t.promotorId)} /> · {sellerName(t.vendedorId)}</div>
              <div className={cn('mt-2 flex flex-wrap items-center gap-2')}><StatusBadge status={t.status} />{action(t)}</div>
            </div>
          </li>
        ))}
      </ul>
      {d.node}
    </>
  );
}
